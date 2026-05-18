import { useLocalSearchParams } from 'expo-router';
import LeagueCalendarPage from '../../../components/LeagueCalendarPage';
import { fetchKboGamesByDate } from '../../../lib/kbo';
import { useLiveJson } from '../../../hooks/useLiveJson';

export default function KBOPage() {
  const { date } = useLocalSearchParams<{ date?: string }>();

  const { payload } = useLiveJson({
    remoteUrl:
      'https://raw.githubusercontent.com/LeChienDesign/taiwan-baseball-app/main/server/data/eventsCenter.kbo.json',
    fallbackPayload: require('../../../server/data/eventsCenter.kbo.json'),
  });

  return (
    <LeagueCalendarPage
      logo={require('../../../assets/league/kbo.png')}
      leagueTitle="韓國職棒 / KBO"
      leagueSubtitle="每日賽事與比分"
      backHref="/events/pro"
      fetchGamesByDate={(selectedDate, options) =>
        fetchKboGamesByDate(selectedDate, {
          ...options,
          payload,
        })
      }
      initialDate={typeof date === 'string' ? date : undefined}
    />
  );
}
