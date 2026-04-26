import LeagueCalendarPage from '../../../components/LeagueCalendarPage';
import { fetchNpbGamesByDate } from '../../../lib/npb-real';

export default function NPBPage() {
  return (
    <LeagueCalendarPage
      logo={require('../../../assets/league/npb.png')}
      leagueTitle="日本職棒 / NPB"
      leagueSubtitle="每日賽事與比分"
      backHref="/events/pro"
      fetchGamesByDate={fetchNpbGamesByDate}
    />
  );
}