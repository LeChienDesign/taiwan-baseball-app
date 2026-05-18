import { useLocalSearchParams } from 'expo-router';
import LeagueCalendarPage from '../../../components/LeagueCalendarPage';
import { fetchMlbGamesByDate } from '../../../lib/mlb';
import { useLiveJson } from '../../../hooks/useLiveJson';

function getTodayKeyNewYork() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export default function MLBPage() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const initialDate = typeof date === 'string' ? date : getTodayKeyNewYork();

  const { payload } = useLiveJson({
    remoteUrl: undefined,
    fallbackPayload: require('../../../server/data/eventsCenter.mlb.json'),
  });

  return (
    <LeagueCalendarPage
      logo={require('../../../assets/league/mlb.png')}
      leagueTitle="美國職棒 / MLB"
      leagueSubtitle="每日賽事及轉播單位"
      backHref="/events/pro"
      fetchGamesByDate={(selectedDate, options) =>
        fetchMlbGamesByDate(selectedDate, {
          ...options,
          payload,
        })
      }
      initialDate={initialDate}
    />
  );
}
