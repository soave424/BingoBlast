'use client';
import type { Game, WordRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BingoBoard } from '@/components/BingoBoard';
import { cn } from '@/lib/utils';
import { Crown, User, ChevronsRight, Bot, Check, X } from 'lucide-react';

interface GameScreenProps {
  game: Game;
  userId: string;
  isHost: boolean;
  onCallWord: (word: string) => void;
  onSetTurn: (playerId: string) => void;
  coachFeedback: string | null;
  onGetCoachFeedback: () => void;
  onRequestWordApproval: (word: string, index: number) => void;
  onResolveWordRequest: (requestId: string, approve: boolean) => void;
}

export function GameScreen({ 
  game, userId, isHost, onCallWord, onSetTurn, coachFeedback, 
  onGetCoachFeedback, onRequestWordApproval, onResolveWordRequest 
}: GameScreenProps) {
  const me = game.players[userId];
  const isMyTurn = game.turn === userId;
  const turnPlayerNickname = game.players[game.turn!]?.nickname || '...';
  
  const sortedPlayers = Object.values(game.players)
    .filter(p => p.id !== game.hostId)
    .sort((a, b) => b.bingoCount - a.bingoCount);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {isMyTurn && (
          <Card className="bg-primary/10 border-primary">
            <CardHeader>
              <CardTitle className="text-primary">당신 차례입니다!</CardTitle>
              <CardDescription>내 빙고판에서 발표할 단어를 선택하세요. 다른 사람이 이미 발표한 단어일 수 있습니다.</CardDescription>
            </CardHeader>
          </Card>
        )}
        {!isMyTurn && !isHost && (
          <Card className="bg-accent/10 border-accent">
            <CardHeader>
              <CardTitle className="text-accent">단어 인정 요청하기</CardTitle>
              <CardDescription>자신의 턴이 아닐 때, 다른 사람이 부른 단어와 동일하거나 유사한 의미의 단어가 내 빙고판에 있다면 클릭하여 호스트에게 인정을 요청할 수 있습니다.</CardDescription>
            </CardHeader>
          </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.values(game.players).filter(p => p.id !== game.hostId).map(player => (
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
                  isInteractive={!isHost}
                  isMyTurn={game.turn === player.id}
                  onCellClick={(word) => onCallWord(word)}
                  onRequestApproval={onRequestWordApproval}
                  playerId={player.id}
                  currentUserId={userId}
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
                  <User className="w-5 h-5" />
                  <span>{player.nickname}</span>
                  {player.isWinner && <span title="우승자">🏆</span>}
                </div>
                <span className="text-lg font-semibold">{player.bingoCount} 빙고</span>
              </div>
            ))}
             {isHost && game.status === 'playing' && <Button onClick={() => onSetTurn(game.turn!)} className="w-full mt-2"><ChevronsRight className="mr-2 h-4 w-4" /> 턴 넘기기</Button>}
          </CardContent>
        </Card>

        {isHost && (
          <Card>
            <CardHeader>
              <CardTitle>단어 인정 요청</CardTitle>
              <CardDescription>참가자들이 보낸 단어 인정 요청을 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {game.wordRequests.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center">아직 요청이 없습니다.</p>
              ) : (
                game.wordRequests.map((req) => (
                  <div key={req.requestId} className="bg-secondary/50 p-3 rounded-md">
                    <p className="text-sm font-medium">
                      <span className="font-bold text-primary">{req.nickname}</span>님이 '<span className="text-accent font-semibold">{req.word}</span>' 인정 요청
                    </p>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button size="icon" variant="outline" className="h-8 w-8 bg-red-100 text-red-600 hover:bg-red-200" onClick={() => onResolveWordRequest(req.requestId, false)}><X/></Button>
                      <Button size="icon" className="h-8 w-8 bg-green-100 text-green-600 hover:bg-green-200" onClick={() => onResolveWordRequest(req.requestId, true)}><Check/></Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

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
        
        {!isHost && (
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
        )}
      </div>
    </div>
  );
}
