import { useLocalSearchParams } from 'expo-router';
import LeagueCalendarPage from '../../../components/LeagueCalendarPage';
import { fetchMlbGamesByDate } from '../../../lib/mlb';

function getTodayKeyNewYork() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export default function MLBPage() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const initialDate = typeof date === 'string' ? date : getTodayKeyNewYork();
  return (
    <LeagueCalendarPage
      logo={require('../../../assets/league/mlb.png')}
      leagueTitle="美國職棒 / MLB"
      leagueSubtitle="每日賽事及轉播單位"
      backHref="/events/pro"
      fetchGamesByDate={fetchMlbGamesByDate}
      initialDate={initialDate}
    />
  );
}
