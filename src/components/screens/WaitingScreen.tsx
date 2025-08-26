'use client';
import { useState, useMemo } from 'react';
import type { Game } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Crown, User, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BingoBoard } from '@/components/BingoBoard';

interface WaitingScreenProps {
  game: Game;
  userId: string;
  isHost: boolean;
  onSubmitBoard: (board: string[]) => void;
  onStartGame: () => void;
}

function PlayerSetup({ game, onSubmitBoard }: { game: Game; onSubmitBoard: (board: string[]) => void }) {
  const [board, setBoard] = useState<string[]>(Array(game.size * game.size).fill(''));
  const { toast } = useToast();

  const handleInputChange = (index: number, value: string) => {
    const newBoard = [...board];
    newBoard[index] = value;
    setBoard(newBoard);
  };
  
  const handleRandomFill = () => {
    const sampleWords = '가,나,다,라,마,바,사,아,자,차,카,타,파,하,거,너,더,러,머,버,서,어,저,처,커'.split(',');
    const wordsToUse = game.isRandomFillEnabled && game.randomWords.length >= board.length 
      ? [...game.randomWords] 
      : sampleWords;
      
    wordsToUse.sort(() => 0.5 - Math.random());
    setBoard(wordsToUse.slice(0, board.length));
  };

  const handleSubmit = () => {
    if (board.some(cell => cell.trim() === '')) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "빙고판의 모든 칸을 채워주세요.",
      });
      return;
    }

    const trimmedBoard = board.map(cell => cell.trim()).filter(Boolean);
    const uniqueWords = new Set(trimmedBoard);
    if (uniqueWords.size !== trimmedBoard.length) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "빙고판에 중복된 단어가 있습니다. 다시 작성해주세요.",
      });
      return;
    }

    onSubmitBoard(board);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>내 빙고판 채우기</CardTitle>
        <CardDescription>빙고판을 모두 채우고 제출해주세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-1.5 mb-4" style={{ gridTemplateColumns: `repeat(${game.size}, 1fr)` }}>
          {board.map((cell, index) => (
            <Input
              key={index}
              value={cell}
              onChange={(e) => handleInputChange(index, e.target.value)}
              className="aspect-square text-center p-1 text-xs sm:text-sm"
            />
          ))}
        </div>
        <div className="flex gap-2">
          {game.isRandomFillEnabled && <Button variant="secondary" onClick={handleRandomFill} className="flex-1">랜덤 채우기</Button>}
          <Button onClick={handleSubmit} className="flex-1">제출하기</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function WaitingScreen({ game, userId, isHost, onSubmitBoard, onStartGame }: WaitingScreenProps) {
  const { toast } = useToast();
  const players = Object.values(game.players);
  const me = game.players[userId];
  const allPlayersReady = useMemo(() => players.every(p => p.isReady), [players]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(game.roomCode);
    toast({ title: '성공', description: '방 코드가 복사되었습니다!' });
  };
  
  return (
    <div className="space-y-6">
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">{game.topic}</CardTitle>
          <CardDescription>대기 중... 친구들에게 방 코드를 공유해주세요!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 bg-muted p-3 rounded-lg">
            <span className="text-3xl font-mono tracking-widest text-primary">{game.roomCode}</span>
            <Button size="icon" variant="ghost" onClick={copyRoomCode}><Copy className="w-6 h-6" /></Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>참가자 목록 ({players.length}명)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {players.map(player => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-2 font-semibold">
                  {player.id === game.hostId ? <Crown className="w-5 h-5 text-primary" /> : <User className="w-5 h-5" />}
                  <span>{player.nickname}</span>
                </div>
                {player.isReady ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Badge variant="outline">준비 중</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
        
        <div className="md:col-span-2 space-y-4">
          {!me.isReady ? (
            <PlayerSetup game={game} onSubmitBoard={onSubmitBoard} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>준비 완료!</CardTitle>
                <CardDescription>다른 플레이어들을 기다리고 있습니다.</CardDescription>
              </CardHeader>
              <CardContent>
                  <BingoBoard size={game.size} board={me.board} marked={me.marked} isInteractive={false} />
              </CardContent>
            </Card>
          )}

          {isHost && (
            <Card>
              <CardHeader>
                <CardTitle>호스트 컨트롤</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={onStartGame} 
                  disabled={!allPlayersReady || players.length < 1}
                  className="w-full text-lg py-6"
                >
                  게임 시작
                </Button>
                {(!allPlayersReady || players.length < 1) && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {players.length < 1 ? "혼자서는 플레이할 수 없습니다." : "모든 참가자가 준비를 마쳐야 합니다."}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
