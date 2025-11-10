
import { supabase } from "@/integrations/supabase/client";

export interface ButtonClick {
  id: string;
  button_name: string;
  clicked_at: string;
  user_id: string | null;
  created_at: string;
}

export interface ButtonClickStats {
  button_name: string;
  total_clicks: number;
  last_clicked: string | null;
  daily_clicks: Array<{ date: string; clicks: number }>;
}

// Reusable function to log button clicks
export const logButtonClick = async (buttonName: string, userId?: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('button_clicks')
      .insert({
        button_name: buttonName,
        user_id: userId || null,
      });

    if (error) {
      console.error('Error logging button click:', error);
    } else {
      console.log(`Button click logged: ${buttonName}`);
    }
  } catch (error) {
    console.error('Error logging button click:', error);
  }
};

// Fetch button click analytics with proper filtering
export const fetchButtonClickAnalytics = async (
  startDate?: string,
  endDate?: string,
  buttonName?: string
): Promise<ButtonClickStats[]> => {
  try {
    let query = supabase
      .from('button_clicks')
      .select('*');

    if (startDate) {
      query = query.gte('clicked_at', startDate);
    }
    if (endDate) {
      query = query.lte('clicked_at', endDate);
    }
    if (buttonName && buttonName !== 'all') {
      query = query.eq('button_name', buttonName);
    }

    const { data, error } = await query.order('clicked_at', { ascending: false });

    if (error) {
      console.error('Error fetching button click analytics:', error);
      throw error;
    }

    // Process data to create statistics
    const statsMap = new Map<string, ButtonClickStats>();

    data?.forEach((click) => {
      const buttonName = click.button_name;
      const clickDate = new Date(click.clicked_at).toISOString().split('T')[0];

      if (!statsMap.has(buttonName)) {
        statsMap.set(buttonName, {
          button_name: buttonName,
          total_clicks: 0,
          last_clicked: null,
          daily_clicks: [],
        });
      }

      const stats = statsMap.get(buttonName)!;
      stats.total_clicks++;
      
      if (!stats.last_clicked || click.clicked_at > stats.last_clicked) {
        stats.last_clicked = click.clicked_at;
      }

      // Group by date
      const dailyClick = stats.daily_clicks.find(dc => dc.date === clickDate);
      if (dailyClick) {
        dailyClick.clicks++;
      } else {
        stats.daily_clicks.push({ date: clickDate, clicks: 1 });
      }
    });

    // Sort daily clicks by date
    statsMap.forEach((stats) => {
      stats.daily_clicks.sort((a, b) => a.date.localeCompare(b.date));
    });

    return Array.from(statsMap.values()).sort((a, b) => b.total_clicks - a.total_clicks);
  } catch (error) {
    console.error('Error fetching button click analytics:', error);
    throw error;
  }
};

// Fetch button click data for charts with proper filtering
export const fetchButtonClickChartData = async (
  startDate?: string,
  endDate?: string,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<Array<{ date: string; [key: string]: any }>> => {
  try {
    let query = supabase
      .from('button_clicks')
      .select('button_name, clicked_at');

    if (startDate) {
      query = query.gte('clicked_at', startDate);
    }
    if (endDate) {
      query = query.lte('clicked_at', endDate);
    }

    const { data, error } = await query.order('clicked_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Process data for chart
    const chartData = new Map<string, { date: string; [key: string]: any }>();

    data?.forEach((click) => {
      const date = new Date(click.clicked_at);
      let dateKey: string;

      switch (groupBy) {
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          dateKey = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          dateKey = date.toISOString().split('T')[0];
      }

      if (!chartData.has(dateKey)) {
        chartData.set(dateKey, { date: dateKey });
      }

      const dayData = chartData.get(dateKey)!;
      dayData[click.button_name] = (dayData[click.button_name] || 0) + 1;
    });

    return Array.from(chartData.values()).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error fetching chart data:', error);
    throw error;
  }
};
