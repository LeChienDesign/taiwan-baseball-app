import { useLocalSearchParams } from 'expo-router';
import LeagueCalendarPage from '../../../components/LeagueCalendarPage';
import { fetchNpbGamesByDate } from '../../../lib/npb';

export default function NPBPage() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  return (
    <LeagueCalendarPage
      logo={require('../../../assets/league/npb.png')}
      leagueTitle="日本職棒 / NPB"
      leagueSubtitle="每日賽事與比分"
      backHref="/events/pro"
      fetchGamesByDate={fetchNpbGamesByDate}
      initialDate={typeof date === 'string' ? date : undefined}
    />
  );
}
