'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Logo } from '@/components/icons/Logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface HomeScreenProps {
  onCreateRoom: (
    topic: string,
    size: number,
    winCondition: number,
    endCondition: number,
    isRandomFillEnabled: boolean,
    randomWords: string[]
  ) => void;
  onJoinRoom: (roomCode: string, nickname: string) => void;
}

export function HomeScreen({ onCreateRoom, onJoinRoom }: HomeScreenProps) {
  const [topic, setTopic] = useState('');
  const [size, setSize] = useState(5);
  const [winCondition, setWinCondition] = useState(1);
  const [endCondition, setEndCondition] = useState(1);
  const [enableRandomFill, setEnableRandomFill] = useState(false);
  const [randomWordsList, setRandomWordsList] = useState('');
  
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!topic) {
      setError('빙고 주제를 입력해주세요.');
      return;
    }
    setError('');
    const randomWords = randomWordsList.split(/[\n,]/).map(w => w.trim()).filter(Boolean);
    onCreateRoom(topic, size, winCondition, endCondition, enableRandomFill, randomWords);
  };

  const handleJoin = () => {
    if (!roomCode || !nickname) {
      setError('방 코드와 닉네임을 모두 입력해주세요.');
      return;
    }
    setError('');
    onJoinRoom(roomCode, nickname);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-4 mb-4">
            <Logo className="w-12 h-12 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-primary font-headline whitespace-nowrap">Interactive Bingo Blast</h1>
          </div>
          <p className="text-muted-foreground">친구들과 함께 즐거운 빙고 한 판!</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">방 만들기</TabsTrigger>
              <TabsTrigger value="join">참여하기</TabsTrigger>
            </TabsList>
            <TabsContent value="create" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="topic">빙고 주제</Label>
                <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="예: 음식, 동물, 영화" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="size">빙고 크기</Label>
                    <Select onValueChange={v => setSize(parseInt(v))} defaultValue="5">
                        <SelectTrigger id="size"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="3">3x3</SelectItem>
                            <SelectItem value="4">4x4</SelectItem>
                            <SelectItem value="5">5x5</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="win-condition">우승 조건 (빙고 수)</Label>
                    <Input id="win-condition" type="number" value={winCondition} onChange={e => setWinCondition(Math.max(1, parseInt(e.target.value)))} min="1" />
                </div>
              </div>
              <div className="items-center flex space-x-2">
                <Checkbox id="enable-random-fill" checked={enableRandomFill} onCheckedChange={c => setEnableRandomFill(!!c)} />
                <Label htmlFor="enable-random-fill" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    '랜덤 채우기' 기능 사용
                </Label>
              </div>
              {enableRandomFill && (
                <div className="space-y-2">
                    <Label htmlFor="random-words-list">랜덤 단어 목록 (쉼표/줄바꿈 구분)</Label>
                    <Textarea id="random-words-list" value={randomWordsList} onChange={e => setRandomWordsList(e.target.value)} placeholder="입력하지 않으면 주제에 맞는 샘플 단어가 사용됩니다." />
                </div>
              )}
              <Button onClick={handleCreate} className="w-full bg-primary hover:bg-primary/90">생성하기</Button>
            </TabsContent>
            <TabsContent value="join" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="room-code-input">방 코드</Label>
                <Input id="room-code-input" value={roomCode} onChange={e => setRoomCode(e.target.value)} placeholder="공유받은 코드 입력" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname-input">닉네임</Label>
                <Input id="nickname-input" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="사용할 닉네임 입력" />
              </div>
              <Button onClick={handleJoin} className="w-full bg-accent hover:bg-accent/90">입장하기</Button>
            </TabsContent>
          </Tabs>
          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
