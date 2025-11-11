import { fetchLocations, Location } from "@/services/locationServices";
import { fetchRestaurantInfo } from "@/services/restaurantInfoService";
import { useQuery } from "@tanstack/react-query";

export interface PublicBranch {
  code: string;
  name: string;
  address?: string;
  city?: string;
}

interface BranchDatabaseResponse {
  success: boolean;
  data?: BranchDatabaseEntry[];
  message?: string;
}

interface BranchDatabaseEntry {
  code?: string | null;
  name?: string | null;
  company?: string | null;
}

interface ConnectClientResponse {
  success: boolean;
  message?: string;
  branches?: BranchApi[];
}

interface BranchApi {
  BRANCH_CODE?: string;
  BRANCH_NAME?: string;
  COMPANY?: string;
}

const normalizeBranchCode = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const dedupeBranches = (branches: PublicBranch[]): PublicBranch[] => {
  const seen = new Set<string>();
  return branches.filter((branch) => {
    const code = branch.code.trim();
    if (seen.has(code)) {
      return false;
    }
    seen.add(code);
    return true;
  });
};

const fetchBranchesFromDatabase = async (): Promise<PublicBranch[]> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/items/branches`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Branch database fetch failed with status ${response.status}`
      );
    }

    const data = (await response.json()) as BranchDatabaseResponse;

    if (!data?.success || !Array.isArray(data.data)) {
      const reason = data?.message ?? "Invalid branch data response";
      throw new Error(reason);
    }

    return data.data
      .map((branch): PublicBranch | null => {
        const code = normalizeBranchCode(branch?.code);
        if (!code) {
          return null;
        }

        const nameCandidate =
          typeof branch?.name === "string" && branch.name.trim().length > 0
            ? branch.name.trim()
            : null;

        return {
          code,
          name: nameCandidate ?? `Branch ${code}`,
          address: undefined,
          city: undefined,
        };
      })
      .filter((branch): branch is PublicBranch => branch !== null);
  } catch (error) {
    console.warn("Failed to load branches from restaurant_branches:", error);
    return [];
  }
};

const fetchBranchesFromConnectClient = async (): Promise<PublicBranch[]> => {
  try {
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("token") : null;

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/connectClient`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { authorization: token } : {}),
        },
        credentials: "include",
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      const errorMessage = `Branch fetch failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as ConnectClientResponse;

    if (!data?.success || !Array.isArray(data.branches)) {
      const reason = data?.message ?? "Unknown error";
      throw new Error(reason);
    }

    return data.branches
      .map((branch): PublicBranch | null => {
        const code = normalizeBranchCode(branch?.BRANCH_CODE);
        if (!code) {
          return null;
        }
        const name =
          typeof branch?.BRANCH_NAME === "string" && branch.BRANCH_NAME.trim().length > 0
            ? branch.BRANCH_NAME.trim()
            : `Branch ${code}`;

        return {
          code,
          name,
        };
      })
      .filter((branch): branch is PublicBranch => branch !== null);
  } catch (error) {
    console.warn("Falling back to local branch sources:", error);
    return [];
  }
};

export const fetchMenuBranches = async (): Promise<PublicBranch[]> => {
  const databaseBranches = await fetchBranchesFromDatabase();

  if (databaseBranches.length > 0) {
    return dedupeBranches(databaseBranches);
  }

  const apiBranches = await fetchBranchesFromConnectClient();

  if (apiBranches.length > 0) {
    return dedupeBranches(apiBranches);
  }

  const [locationsResult, restaurantInfo] = await Promise.all([
    fetchLocations().catch((error) => {
      console.warn("Failed to load locations for branch selection:", error);
      return [];
    }),
    fetchRestaurantInfo().catch((error) => {
      console.warn("Failed to load restaurant info for branch selection:", error);
      return null;
    }),
  ]);

  const locationBranches = Array.isArray(locationsResult)
    ? locationsResult
        .map((location: Location): PublicBranch | null => {
          const code =
            normalizeBranchCode(location.branch_code) ??
            normalizeBranchCode(location.branchCode);
          if (!code) {
            return null;
          }

          return {
            code,
            name: location.name || `Branch ${code}`,
            address: location.address,
            city: location.city,
          };
        })
        .filter((branch): branch is PublicBranch => branch !== null)
    : [];

  if (locationBranches.length > 0) {
    return dedupeBranches(locationBranches);
  }

  const fallbackCodeCandidates = [
    normalizeBranchCode(restaurantInfo?.branch_code),
    normalizeBranchCode(import.meta.env.VITE_DEFAULT_BRANCH_CODE),
    normalizeBranchCode(import.meta.env.VITE_BRANCH_CODE),
  ];

  const fallbackCode = fallbackCodeCandidates.find((code) => code !== null);

  if (!fallbackCode) {
    return [];
  }

  const fallbackNameCandidates = [
    restaurantInfo?.name,
    import.meta.env.VITE_DEFAULT_BRANCH_NAME,
    "Main Branch",
  ];

  const fallbackName =
    fallbackNameCandidates.find(
      (value): value is string => typeof value === "string" && value.trim().length > 0
    ) ?? "Main Branch";

  const fallbackBranch: PublicBranch = {
    code: fallbackCode,
    name: fallbackName,
    address: restaurantInfo?.slogan ?? undefined,
    city: undefined,
  };

  return [fallbackBranch];
};

export const useMenuBranches = () =>
  useQuery({
    queryKey: ["menuBranches"],
    queryFn: fetchMenuBranches,
    staleTime: 1000 * 60 * 5,
  });

