'use client';
import type { Game, Player } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultScreenProps {
  game: Game;
  onBackToHome: () => void;
}

export function ResultScreen({ game, onBackToHome }: ResultScreenProps) {
  const sortedPlayers = Object.values(game.players)
    .filter(p => p.id !== game.hostId)
    .sort((a, b) => {
      if (b.bingoCount !== a.bingoCount) {
        return b.bingoCount - a.bingoCount;
      }
      // 빙고 수가 같으면, 마지막 빙고 달성 시간이 더 빠른 사람이 높은 순위
      // lastBingoTimestamp가 없는 경우 (빙고 0개)는 나중에 정렬
      if (a.lastBingoTimestamp && b.lastBingoTimestamp) {
        return a.lastBingoTimestamp - b.lastBingoTimestamp;
      }
      if (a.lastBingoTimestamp) return -1; // a는 빙고가 있고, b는 없음
      if (b.lastBingoTimestamp) return 1; // b는 빙고가 있고, a는 없음
      return 0; // 둘 다 빙고 없음
  });
  
  const getRankContent = (index: number) => {
    switch (index) {
      case 0: return { icon: '🥇', text: '1위', bg: 'bg-yellow-200/50' };
      case 1: return { icon: '🥈', text: '2위', bg: 'bg-gray-300/50' };
      case 2: return { icon: '🥉', text: '3위', bg: 'bg-orange-300/50' };
      default: return { icon: `${index + 1}`, text: '위', bg: 'bg-secondary' };
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-4xl font-bold font-headline">게임 종료!</CardTitle>
          <CardDescription>최종 순위</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedPlayers.map((player, index) => {
            const rank = getRankContent(index);
            return (
              <div key={player.id} className={cn("p-4 rounded-lg flex items-center justify-between", rank.bg)}>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold w-12">{rank.icon} {index > 2 && rank.text}</span>
                  <span className="text-lg font-medium">{player.nickname}</span>
                </div>
                <span className="text-lg font-semibold">{player.bingoCount} 빙고</span>
              </div>
            );
          })}
          <Button onClick={onBackToHome} className="w-full mt-6 text-lg py-6">처음으로 돌아가기</Button>
        </CardContent>
      </Card>
    </div>
  );
}
