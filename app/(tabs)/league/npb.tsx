import { useLocalSearchParams } from 'expo-router';
import LeagueCalendarPage from '../../../components/LeagueCalendarPage';
import { fetchNpbGamesByDate } from '../../../lib/npb';
import { useLiveJson } from '../../../hooks/useLiveJson';

export default function NPBPage() {
  const { date } = useLocalSearchParams<{ date?: string }>();

  const { payload } = useLiveJson({
    remoteUrl:
      'https://raw.githubusercontent.com/LeChienDesign/taiwan-baseball-app/main/server/data/eventsCenter.npb.json',
    fallbackPayload: require('../../../server/data/eventsCenter.npb.json'),
  });

  return (
    <LeagueCalendarPage
      logo={require('../../../assets/league/npb.png')}
      leagueTitle="日本職棒 / NPB"
      leagueSubtitle="每日賽事與比分"
      backHref="/events/pro"
      fetchGamesByDate={(selectedDate, options) =>
        fetchNpbGamesByDate(selectedDate, {
          ...options,
          payload,
        })
      }
      initialDate={typeof date === 'string' ? date : undefined}
    />
  );
}
