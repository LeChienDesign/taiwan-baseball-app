import LeagueCalendarPage from '../../../components/LeagueCalendarPage';
import { fetchCpblMajorGamesByDate } from '../../../lib/cpbl-real';

export default function CPBLMajorPage() {
  return (
    <LeagueCalendarPage
      logo={require('../../../assets/league/cpbl.png')}
      leagueTitle="中華職棒 / CPBL"
      leagueSubtitle="每日賽事及轉播單位"
      backHref="/events/pro"
      fetchGamesByDate={fetchCpblMajorGamesByDate}
    />
  );
}