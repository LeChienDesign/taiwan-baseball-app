import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from './BackButton';
import ScoreboardCard from './ScoreboardCard';

type LeagueCalendarPageProps = {
  logo: any;
  leagueTitle: string;
  leagueSubtitle: string;
  backHref: string;
  fetchGamesByDate: (date: string) => Promise<any[]>;
  initialDate?: string;
};
type CalendarCell = {
  day: number | '';
};

type DayMeta = {
  count: number;
  hasScheduled: boolean;
  hasLive: boolean;
  hasFinal: boolean;
  preview: string;
};

const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function firstWeekdayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

function monthTitleText(year: number, month: number) {
  return `${year} 年 ${month} 月轉播月曆`;
}

function makeDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function normalizeStatus(status: any) {
  const raw = String(status || '').toUpperCase();

  if (raw.includes('LIVE') || raw.includes('比賽中')) return 'LIVE';
  if (raw.includes('FINAL') || raw.includes('結束') || raw.includes('完賽')) return 'FINAL';
  return 'SCHEDULED';
}

function getDayPreview(games: any[]) {
  if (!games.length) return '';

  const liveGame = games.find((game) => normalizeStatus(game.status) === 'LIVE');
  if (liveGame) return 'LIVE';

  const finalGame = games.find((game) => normalizeStatus(game.status) === 'FINAL');
  if (finalGame) return `${finalGame.awayScore ?? 0}-${finalGame.homeScore ?? 0}`;

  const firstGame = games[0];
  return firstGame?.footerRight || firstGame?.gameTime || '賽程';
}

function hasLiveGame(games: any[]) {
  return games.some((game) => normalizeStatus(game.status) === 'LIVE');
}

function makeMonthCacheKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function buildMonthCells(year: number, month: number): CalendarCell[] {
  const totalDays = daysInMonth(year, month);
  const firstDay = firstWeekdayOfMonth(year, month);

  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push({ day: '' });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({ day });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ day: '' });
  }

  return cells;
}

export default function LeagueCalendarPage({
  logo,
  leagueTitle,
  leagueSubtitle,
  backHref,
  fetchGamesByDate,
  initialDate,
}: LeagueCalendarPageProps) {
  const now = new Date();
  const initialDateParts = initialDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const initialYear = initialDateParts ? Number(initialDateParts[1]) : now.getFullYear();
  const initialMonth = initialDateParts ? Number(initialDateParts[2]) : now.getMonth() + 1;
  const initialDay = initialDateParts ? Number(initialDateParts[3]) : now.getDate();

  const [displayYear, setDisplayYear] = useState(initialYear);
  const [displayMonth, setDisplayMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(initialDay);

  const [realGames, setRealGames] = useState<any[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [gamesError, setGamesError] = useState<string | null>(null);

  const [monthMeta, setMonthMeta] = useState<Record<number, DayMeta>>({});
  const [loadingMonthCounts, setLoadingMonthCounts] = useState(false);
  const monthMetaCacheRef = useRef<Record<string, Record<number, DayMeta>>>({});
  const monthLoadingRef = useRef<Record<string, boolean>>({});
  const latestSelectedDateRef = useRef<string | null>(null);

  const cells = useMemo(
    () => buildMonthCells(displayYear, displayMonth),
    [displayYear, displayMonth]
  );

  const isCurrentMonth =
    displayYear === now.getFullYear() && displayMonth === now.getMonth() + 1;

  const today = now.getDate(); 

  const loadGamesForDay = useCallback(
    async (year: number, month: number, day: number, options?: { silent?: boolean }) => {
      const dateKey = makeDateKey(year, month, day);
      latestSelectedDateRef.current = dateKey;

      try {
        if (!options?.silent) {
          setLoadingGames(true);
        }
        setGamesError(null);
        const games = await fetchGamesByDate(dateKey);

        if (latestSelectedDateRef.current !== dateKey) {
          return;
        }

        setRealGames(games);

        const nextMeta: DayMeta = {
          count: games.length,
          hasScheduled: games.some((g) => normalizeStatus(g.status) === 'SCHEDULED'),
          hasLive: games.some((g) => normalizeStatus(g.status) === 'LIVE'),
          hasFinal: games.some((g) => normalizeStatus(g.status) === 'FINAL'),
          preview: getDayPreview(games),
        };

        const cacheKey = makeMonthCacheKey(year, month);
        monthMetaCacheRef.current[cacheKey] = {
          ...(monthMetaCacheRef.current[cacheKey] ?? {}),
          [day]: nextMeta,
        };

        if (year === displayYear && month === displayMonth) {
          setMonthMeta((current) => ({ ...current, [day]: nextMeta }));
        }
      } catch (error: any) {
        if (latestSelectedDateRef.current !== dateKey) {
          return;
        }

        setGamesError(error?.message ?? '載入失敗');
        setRealGames([]);
      } finally {
        if (!options?.silent && latestSelectedDateRef.current === dateKey) {
          setLoadingGames(false);
        }
      }
    },
    [displayMonth, displayYear, fetchGamesByDate]
  );

  const loadMonthCounts = useCallback(
    async (year: number, month: number) => {
      const cacheKey = makeMonthCacheKey(year, month);
      const cachedMeta = monthMetaCacheRef.current[cacheKey];

      if (cachedMeta) {
        setMonthMeta(cachedMeta);
        return;
      }

      if (monthLoadingRef.current[cacheKey]) {
        return;
      }

      try {
        monthLoadingRef.current[cacheKey] = true;
        setLoadingMonthCounts(true);

        const totalDays = daysInMonth(year, month);
        const entries = await Promise.all(
          Array.from({ length: totalDays }, async (_, index) => {
            const day = index + 1;
            const dateKey = makeDateKey(year, month, day);

            try {
              const games = await fetchGamesByDate(dateKey);

              const meta: DayMeta = {
                count: games.length,
                hasScheduled: games.some((g) => normalizeStatus(g.status) === 'SCHEDULED'),
                hasLive: games.some((g) => normalizeStatus(g.status) === 'LIVE'),
                hasFinal: games.some((g) => normalizeStatus(g.status) === 'FINAL'),
                preview: getDayPreview(games),
              };

              return [day, meta] as const;
            } catch {
              return [
                day,
                {
                  count: 0,
                  hasScheduled: false,
                  hasLive: false,
                  hasFinal: false,
                  preview: '',
                },
              ] as const;
            }
          })
        );

        const nextMeta: Record<number, DayMeta> = {};
        for (const [day, meta] of entries) {
          nextMeta[day] = meta;
        }

        monthMetaCacheRef.current[cacheKey] = nextMeta;

        if (year === displayYear && month === displayMonth) {
          setMonthMeta(nextMeta);
        }
      } finally {
        monthLoadingRef.current[cacheKey] = false;
        setLoadingMonthCounts(false);
      }
    },
    [displayMonth, displayYear, fetchGamesByDate]
  );

  useEffect(() => {
    loadMonthCounts(displayYear, displayMonth);
  }, [displayYear, displayMonth, loadMonthCounts]);

  useEffect(() => {
    if (selectedDay != null) {
      loadGamesForDay(displayYear, displayMonth, selectedDay);
    } else {
      latestSelectedDateRef.current = null;
    }
  }, [displayYear, displayMonth, selectedDay, loadGamesForDay]);

  useEffect(() => {
    if (selectedDay == null || !hasLiveGame(realGames)) {
      return;
    }

    const timer = setInterval(() => {
      loadGamesForDay(displayYear, displayMonth, selectedDay, { silent: true });
    }, 30000);

    return () => clearInterval(timer);
  }, [displayYear, displayMonth, selectedDay, realGames, loadGamesForDay]);

  const goPrevMonth = () => {
    if (displayMonth === 1) {
      setDisplayYear((y) => y - 1);
      setDisplayMonth(12);
      setSelectedDay(null);
      setRealGames([]);
      latestSelectedDateRef.current = null;
      return;
    }
    setDisplayMonth((m) => m - 1);
    setSelectedDay(null);
    setRealGames([]);
    latestSelectedDateRef.current = null;
  };

  const goNextMonth = () => {
    if (displayMonth === 12) {
      setDisplayYear((y) => y + 1);
      setDisplayMonth(1);
      setSelectedDay(null);
      setRealGames([]);
      latestSelectedDateRef.current = null;
      return;
    }
    setDisplayMonth((m) => m + 1);
    setSelectedDay(null);
    setRealGames([]);
    latestSelectedDateRef.current = null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.page}>
        <BackButton style={styles.backButton} fallbackHref={backHref} />

        <View style={styles.headerBar}>
          <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>{leagueTitle}</Text>
            <Text style={styles.headerSubtitle}>{leagueSubtitle}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.monthRow}>
            <TouchableOpacity
              style={styles.switchBtn}
              activeOpacity={0.85}
              onPress={goPrevMonth}
            >
              <Text style={styles.switchBtnText}>上個月</Text>
            </TouchableOpacity>

            <Text style={styles.monthTitle}>
              {monthTitleText(displayYear, displayMonth)}
            </Text>

            <TouchableOpacity
              style={styles.switchBtn}
              activeOpacity={0.85}
              onPress={goNextMonth}
            >
              <Text style={styles.switchBtnText}>下個月</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.infoText}>點日期後，顯示當日賽程計分板。</Text>

          <View style={styles.weekRow}>
            {weekdayLabels.map((label) => (
              <View key={label} style={styles.weekCell}>
                <Text style={styles.weekText}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {cells.map((item, index) => {
              const highlight = isCurrentMonth && item.day === today;
              const active = item.day !== '' && item.day === selectedDay;

              const meta =
                item.day === ''
                  ? {
                      count: 0,
                      hasScheduled: false,
                      hasLive: false,
                      hasFinal: false,
                      preview: '',
                    }
                  : monthMeta[item.day] ?? {
                      count: 0,
                      hasScheduled: false,
                      hasLive: false,
                      hasFinal: false,
                      preview: '',
                    };

              const count = meta.count;
              const preview = meta.preview;
              const isOnlyFinal =
                meta.count > 0 && !meta.hasScheduled && !meta.hasLive && meta.hasFinal;
              const hasUpcomingOrLive = meta.hasScheduled || meta.hasLive;

              return (
                <TouchableOpacity
                  key={`${item.day}-${index}`}
                  activeOpacity={item.day === '' ? 1 : 0.85}
                  onPress={() => {
                    if (item.day === '') return;
                    setSelectedDay(item.day);
                  }}
                  style={[
                    styles.dayCell,
                    item.day === '' && styles.dayCellEmpty,
                    isOnlyFinal && styles.dayCellFinalOnly,
                    highlight && styles.dayCellHighlight,
                    active && styles.dayCellActive,
                  ]}
                >
                  {item.day !== '' && (
                    <>
                      <Text style={[styles.dayNumber, highlight && styles.dayNumberToday]}>
                        {item.day}
                      </Text>

                      {loadingMonthCounts ? (
                        <Text style={styles.gamesInlineText}>…</Text>
                      ) : count > 0 ? (
                        <View style={styles.eventIndicatorWrap}>
                          <View
                            style={[
                              styles.eventDot,
                              highlight && styles.eventDotToday,
                              isOnlyFinal && styles.eventDotFinalOnly,
                              hasUpcomingOrLive && styles.eventDotActive,
                              meta.hasLive && styles.eventDotLive,
                            ]}
                          />

                          {!!preview && (
                            <Text
                              style={[
                                styles.dayPreviewText,
                                meta.hasLive && styles.dayPreviewLive,
                                isOnlyFinal && styles.dayPreviewFinal,
                              ]}
                              numberOfLines={1}
                            >
                              {preview}
                            </Text>
                          )}

                          {count > 1 ? (
                            <View
                              style={[
                                styles.eventBadge,
                                active && styles.eventBadgeSelected,
                                highlight && styles.eventBadgeToday,
                                isOnlyFinal && styles.eventBadgeFinalOnly,
                              ]}
                            >
                              <Text style={styles.eventBadgeText}>{count}</Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.scoreboardSection}>
          <Text style={styles.scoreboardTitle}>
            {selectedDay ? `${displayMonth}/${selectedDay} 當日賽程` : '請選擇日期'}
          </Text>

          {selectedDay == null ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>請先選擇日期</Text>
            </View>
          ) : loadingGames ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>載入中…</Text>
            </View>
          ) : gamesError ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>{gamesError}</Text>
            </View>
          ) : realGames.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>這一天沒有比賽</Text>
            </View>
          ) : (
            realGames.map((game) => (
              <ScoreboardCard
                key={game.id}
                status={game.status}
                venue={game.venue}
                awayTeam={game.awayTeam}
                homeTeam={game.homeTeam}
                awayScore={game.awayScore}
                homeScore={game.homeScore}
                innings={game.innings}
                awayLine={game.awayLine}
                homeLine={game.homeLine}
                footerLeft={game.footerLeft}
                footerRight={game.footerRight}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  page: {
    paddingHorizontal: 12,
    paddingTop: 18,
    paddingBottom: 24,
  },
  backButton: {
    marginBottom: 14,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerLogo: {
    width: 74,
    height: 44,
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#9aa7bf',
    fontSize: 10,
    fontWeight: '400',
  },
  card: {
    backgroundColor: '#121826',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#273247',
    paddingTop: 14,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  switchBtn: {
    backgroundColor: '#2a3244',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  switchBtnText: {
    color: '#d8deea',
    fontSize: 10,
    fontWeight: '400',
  },
  monthTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoText: {
    color: '#9aa7bf',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '400',
    marginBottom: 10,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekCell: {
    width: '13.3%',
    backgroundColor: '#1b2231',
    borderRadius: 12,
    paddingVertical: 7,
    alignItems: 'center',
  },
  weekText: {
    color: '#d5ddeb',
    fontSize: 10,
    fontWeight: '400',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  dayCell: {
    width: '13.3%',
    height: 92,
    backgroundColor: '#2a3142',
    borderRadius: 18,
    paddingTop: 8,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dayCellHighlight: {
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    backgroundColor: '#31394d',
  },
  dayCellActive: {
    borderWidth: 2,
    borderColor: '#60a5fa',
    backgroundColor: '#243247',
  },
  dayCellFinalOnly: {
    backgroundColor: '#232938',
    borderColor: '#2d3748',
  },
  dayCellEmpty: {
    backgroundColor: 'transparent',
  },
  dayNumber: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 18,
  },
  dayNumberToday: {
    color: '#fbbf24',
  },
  gamesInlineText: {
    color: '#cfd7e6',
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 2,
  },
  dayPreviewText: {
    color: '#dbeafe',
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '800',
    marginTop: 4,
    maxWidth: 42,
    textAlign: 'center',
  },
  dayPreviewLive: {
    color: '#fecaca',
    letterSpacing: 0.2,
  },
  dayPreviewFinal: {
    color: '#cbd5e1',
  },
  eventIndicatorWrap: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 18,
  },
  eventDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#64748b',
  },
  eventDotActive: {
    backgroundColor: '#60a5fa',
  },
  eventDotLive: {
    backgroundColor: '#ef4444',
  },
  eventDotToday: {
    backgroundColor: '#fbbf24',
  },
  eventDotFinalOnly: {
    backgroundColor: '#475569',
  },
  eventBadge: {
    marginTop: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventBadgeSelected: {
    borderColor: '#93c5fd',
    backgroundColor: '#1d4ed8',
  },
  eventBadgeToday: {
    borderColor: '#fbbf24',
  },
  eventBadgeFinalOnly: {
    borderColor: '#475569',
    backgroundColor: '#273142',
  },
  eventBadgeText: {
    color: '#dbeafe',
    fontSize: 9,
    lineHeight: 10,
    fontWeight: '700',
  },
  scoreboardSection: {
    marginTop: 16,
  },
  scoreboardTitle: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyBox: {
    backgroundColor: '#121826',
    borderWidth: 1,
    borderColor: '#273247',
    borderRadius: 20,
    padding: 16,
  },
  emptyText: {
    color: '#9aa7bf',
    fontSize: 12,
  },
});
