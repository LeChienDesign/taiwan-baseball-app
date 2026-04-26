import LeagueCalendarPage from '../../../components/LeagueCalendarPage';
import { fetchKboGamesByDate } from '../../../lib/kbo-real';

export default function KBOPage() {
  return (
    <LeagueCalendarPage
      logo={require('../../../assets/league/kbo.png')}
      leagueTitle="韓國職棒 / KBO"
      leagueSubtitle="每日賽事與比分"
      backHref="/events/pro"
      fetchGamesByDate={fetchKboGamesByDate}
    />
  );
}