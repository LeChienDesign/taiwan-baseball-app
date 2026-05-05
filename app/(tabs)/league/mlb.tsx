import { useLocalSearchParams } from 'expo-router';
import LeagueCalendarPage from '../../../components/LeagueCalendarPage';
import { fetchMlbGamesByDate } from '../../../lib/mlb';

export default function MLBPage() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  return (
    <LeagueCalendarPage
      logo={require('../../../assets/league/mlb.png')}
      leagueTitle="美國職棒 / MLB"
      leagueSubtitle="每日賽事及轉播單位"
      backHref="/events/pro"
      fetchGamesByDate={fetchMlbGamesByDate}
      initialDate={typeof date === 'string' ? date : undefined}
    />
  );
}
