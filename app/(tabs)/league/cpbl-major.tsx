import { useLocalSearchParams } from 'expo-router';
import LeagueCalendarPage from '../../../components/LeagueCalendarPage';
import { fetchCpblMajorGamesByDate } from '../../../lib/cpbl-real';

export default function CPBLMajorPage() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  return (
    <LeagueCalendarPage
      logo={require('../../../assets/league/cpbl.png')}
      leagueTitle="中華職棒 / CPBL"
      leagueSubtitle="每日賽事及轉播單位"
      backHref="/events/pro"
      fetchGamesByDate={fetchCpblMajorGamesByDate}
      initialDate={typeof date === 'string' ? date : undefined}
    />
  );
}
