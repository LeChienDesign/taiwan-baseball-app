import LeagueCalendarPage from '../../../components/LeagueCalendarPage';
import { fetchCpblMinorGamesByDate } from '../../../lib/cpbl-minor-real';

export default function CPBLMinorPage() {
  return (
    <LeagueCalendarPage
      logo={require('../../../assets/league/cpbl.png')}
      leagueTitle="中華職棒二軍 / CPBL"
      leagueSubtitle="二軍賽程與比分"
      backHref="/league/cpbl"
      fetchGamesByDate={fetchCpblMinorGamesByDate}
    />
  );
}