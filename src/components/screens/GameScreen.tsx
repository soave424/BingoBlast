'use client';
import type { Game } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BingoBoard } from '@/components/BingoBoard';
import { cn } from '@/lib/utils';
import { Crown, User, ChevronsRight, Bot } from 'lucide-react';

interface GameScreenProps {
  game: Game;
  userId: string;
  isHost: boolean;
  onCallWord: (word: string) => void;
  onSetTurn: (playerId: string) => void;
  coachFeedback: string | null;
  onGetCoachFeedback: () => void;
}

export function GameScreen({ game, userId, isHost, onCallWord, onSetTurn, coachFeedback, onGetCoachFeedback }: GameScreenProps) {
  const me = game.players[userId];
  const isMyTurn = game.turn === userId;
  const turnPlayerNickname = game.players[game.turn!]?.nickname || '...';
  
  const sortedPlayers = Object.values(game.players).sort((a, b) => b.bingoCount - a.bingoCount);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {isMyTurn && (
          <Card className="bg-primary/10 border-primary">
            <CardHeader>
              <CardTitle className="text-primary">당신 차례입니다!</CardTitle>
              <CardDescription>내 빙고판에서 발표할 단어를 선택하세요.</CardDescription>
            </CardHeader>
          </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.values(game.players).map(player => (
            <Card key={player.id} className={cn("transition-all", game.turn === player.id && "turn-highlight")}>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {player.id === game.hostId ? <Crown className="w-4 h-4 text-primary" /> : <User className="w-4 h-4" />}
                    {player.nickname}
                  </span>
                  <span className="font-mono text-primary">{player.bingoCount} 빙고</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <BingoBoard
                  size={game.size}
                  board={player.board}
                  marked={player.marked}
                  isInteractive={player.id === userId && isMyTurn}
                  onCellClick={(word) => onCallWord(word)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>게임 현황</CardTitle>
            <CardDescription>현재 <span className="font-bold text-primary">{turnPlayerNickname}</span> 님의 차례입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedPlayers.map(player => (
              <div
                key={player.id}
                onClick={() => isHost && onSetTurn(player.id)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg bg-secondary",
                  isHost && "cursor-pointer hover:bg-primary/10",
                  game.turn === player.id && "ring-2 ring-primary"
                )}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {player.id === game.hostId ? <Crown className="w-5 h-5 text-primary" /> : <User className="w-5 h-5" />}
                  <span>{player.nickname}</span>
                  {player.isWinner && <span title="우승자">🏆</span>}
                </div>
                <span className="text-lg font-semibold">{player.bingoCount} 빙고</span>
              </div>
            ))}
             {isHost && <Button onClick={() => onSetTurn(game.turn || userId)} className="w-full mt-2"><ChevronsRight className="mr-2 h-4 w-4" /> 턴 넘기기</Button>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>발표된 단어</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 overflow-y-auto bg-muted p-3 rounded-md flex flex-col-reverse gap-2">
              {game.calledWords.length === 0 ? (
                <p className="text-muted-foreground text-center">아직 발표된 단어가 없습니다.</p>
              ) : (
                [...game.calledWords].reverse().map((word, index) => (
                  <div key={index} className="bg-background p-2 rounded shadow-sm text-sm font-medium">
                    {word}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-2">
          <Button onClick={onGetCoachFeedback} className="w-full" disabled={!game.calledWords.length}>
            <Bot className="mr-2"/> AI 코치에게 조언받기
          </Button>
          {coachFeedback && (
            <div className="relative bg-accent text-accent-foreground p-4 rounded-lg shadow-lg">
               <div className="absolute bottom-full left-4 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-accent"></div>
               <p className="text-sm">{coachFeedback}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
