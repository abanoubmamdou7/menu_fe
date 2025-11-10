import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Menu as MenuIcon, User, Store } from 'lucide-react';
import LinkButton from '@/components/LinkButton';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMenuBranches, PublicBranch } from '@/services/branchService';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const MainNavigationLinks: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const translate = (key: string, fallback: string) => {
    const value = t(key);
    if (!value) {
      return fallback;
    }
    return value !== key ? value : fallback;
  };
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [manualBranchCode, setManualBranchCode] = useState('');
  const [manualBranchName, setManualBranchName] = useState('');
  const [selectedBranchCode, setSelectedBranchCode] = useState('');

  const {
    data: branchOptions = [],
    isLoading: isLoadingBranches,
    isError: hasBranchError,
  } = useMenuBranches();

  const branches = useMemo<PublicBranch[]>(() => branchOptions ?? [], [branchOptions]);
  useEffect(() => {
    if (!isBranchDialogOpen) {
      setManualBranchCode('');
      setManualBranchName('');
      return;
    }

    if (branches.length === 1) {
      setSelectedBranchCode(branches[0].code);
      return;
    }

    if (!selectedBranchCode && typeof window !== 'undefined') {
      try {
        const storedCode = window.localStorage.getItem('selectedBranchCode');
        if (storedCode && branches.some((branch) => branch.code === storedCode)) {
          setSelectedBranchCode(storedCode);
        }
      } catch (error) {
        console.warn('Unable to preselect stored branch', error);
      }
    }
  }, [isBranchDialogOpen, branches, selectedBranchCode]);

  const handleBranchNavigation = (branch: { code: string; name: string }) => {
    const branchCode = branch.code.trim();
    if (!branchCode) {
      return;
    }

    const params = new URLSearchParams();
    params.set('branch', branchCode);
    if (branch.name) {
      params.set('branchName', branch.name);
    }

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('selectedBranchCode', branchCode);
        if (branch.name) {
          window.localStorage.setItem('selectedBranchName', branch.name);
        }
      }
    } catch (error) {
      console.warn('Unable to persist branch selection', error);
    }

    setIsBranchDialogOpen(false);
    navigate(`/menu?${params.toString()}`);
  };

  const handleManualBranchSubmit = (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    const trimmedCode = manualBranchCode.trim();
    if (!trimmedCode) {
      return;
    }

    handleBranchNavigation({
      code: trimmedCode,
      name: manualBranchName.trim() || trimmedCode,
    });
  };

  const handleViewMenuClick: React.MouseEventHandler<HTMLElement> = (event) => {
    event.preventDefault();
    setIsBranchDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto px-4">
        <LinkButton
          href="/menu"
          icon={MenuIcon}
          label={t('viewMenu')}
          asComponent={Link}
          onClick={handleViewMenuClick}
          style={{
            backgroundColor: 'rgb(234, 88, 12)',
            color: '#fff',
            width: '100%',
            textAlign: 'center',
            padding: '1rem',
            borderRadius: '0.75rem',
            fontSize: '1.125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
          hoverStyle={{
            backgroundColor: 'rgba(234, 88, 12, 0.9)',
          }}
        />

        <LinkButton
          href="/locations"
          icon={MapPin}
          label={t('ourLocations')}
          asComponent={Link}
          style={{
            backgroundColor: '#4285F4',
            color: '#fff',
            width: '100%',
            textAlign: 'center',
            padding: '1rem',
            borderRadius: '0.75rem',
            fontSize: '1.125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
          hoverStyle={{
            backgroundColor: 'rgba(66, 133, 244, 0.9)',
          }}
        />

        <LinkButton
          href="/register"
          icon={User}
          label={t('registerAsCustomer')}
          asComponent={Link}
          style={{
            backgroundColor: '#8B5CF6',
            color: '#fff',
            width: '100%',
            textAlign: 'center',
            padding: '1rem',
            borderRadius: '0.75rem',
            fontSize: '1.125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
          hoverStyle={{
            backgroundColor: 'rgba(139, 92, 246, 0.9)',
          }}
        />
      </div>

      <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-orange-500" />
              {t('selectBranch')}
            </DialogTitle>
            <DialogDescription>{t('selectBranchDescription')}</DialogDescription>
          </DialogHeader>

          {isLoadingBranches && branches.length === 0 ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : branches.length > 0 ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  {translate('selectBranch', 'Select a branch')}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {branches.map((branch) => {
                    const isSelected = selectedBranchCode === branch.code;
                    return (
                      <Button
                        key={branch.code}
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedBranchCode(branch.code);
                          handleBranchNavigation(branch);
                        }}
                        className={cn(
                          'w-full justify-start rounded-xl border px-4 py-3 text-left transition-all',
                          'focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
                          isSelected
                            ? 'border-orange-500 bg-orange-500 text-white shadow-lg'
                            : 'border-orange-200 bg-white text-gray-900 hover:border-orange-300 hover:bg-orange-50'
                        )}
                      >
                        <p className="text-base font-semibold leading-tight">
                          {branch.name}
                        </p>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBranchDialogOpen(false)}
                >
                  {t('close')}
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleManualBranchSubmit}
              className="rounded-xl border border-dashed border-orange-200 p-6 space-y-4"
            >
              <p className="text-sm text-gray-600 leading-relaxed">
                {hasBranchError ? t('errorLoadingBranches') : t('noBranchesAvailable')}
              </p>
              <div className="space-y-3 text-left">
                <label className="block text-sm font-medium text-gray-700">
                  {t('branchCodeLabel')}
                </label>
                <Input
                  value={manualBranchCode}
                  placeholder={t('enterBranchCode')}
                  onChange={(event) => setManualBranchCode(event.target.value)}
                  required
                />
                <label className="block text-sm font-medium text-gray-700">
                  {t('branchNameOptional')}
                </label>
                <Input
                  value={manualBranchName}
                  placeholder={t('enterBranchNameOptional')}
                  onChange={(event) => setManualBranchName(event.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBranchDialogOpen(false)}
                >
                  {t('close')}
                </Button>
                <Button type="submit" disabled={!manualBranchCode.trim()}>
                  {t('continue')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MainNavigationLinks;