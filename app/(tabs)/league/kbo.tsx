import { useLocalSearchParams } from 'expo-router';
import LeagueCalendarPage from '../../../components/LeagueCalendarPage';
import { fetchKboGamesByDate } from '../../../lib/kbo-real';

export default function KBOPage() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  return (
    <LeagueCalendarPage
      logo={require('../../../assets/league/kbo.png')}
      leagueTitle="韓國職棒 / KBO"
      leagueSubtitle="每日賽事與比分"
      backHref="/events/pro"
      fetchGamesByDate={fetchKboGamesByDate}
      initialDate={typeof date === 'string' ? date : undefined}
    />
  );
}
