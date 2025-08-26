'use client';

import type { Game, Player, GameStatus } from '@/lib/types';
import { useState, useEffect } from 'react';
import { HomeScreen } from '@/components/screens/HomeScreen';
import { WaitingScreen } from '@/components/screens/WaitingScreen';
import { GameScreen } from '@/components/screens/GameScreen';
import { ResultScreen } from '@/components/screens/ResultScreen';
import { generateRoomCode, checkBingo } from '@/lib/game-utils';
import { useToast } from '@/hooks/use-toast';
import { generateFeedback } from '@/app/actions';
import type { FeedbackInput } from '@/ai/flows/positive-feedback';

export default function Home() {
  const [game, setGame] = useState<Game | null>(null);
  const [user, setUser] = useState<{ id: string; nickname: string } | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate user authentication on component mount
    setUser({ id: `user_${Math.random().toString(36).substr(2, 9)}`, nickname: '' });
  }, []);

  const handleCreateRoom = (
    topic: string,
    size: number,
    winCondition: number,
    endCondition: number,
    isRandomFillEnabled: boolean,
    randomWords: string[]
  ) => {
    if (!user) return;
    const hostId = user.id;
    const hostNickname = '호스트';
    setIsHost(true);
    setUser(prev => ({...prev!, nickname: hostNickname}));

    const newGame: Game = {
      id: `game_${Math.random().toString(36).substr(2, 9)}`,
      hostId,
      roomCode: generateRoomCode(),
      topic,
      size,
      winCondition,
      endCondition,
      isRandomFillEnabled,
      randomWords,
      status: 'waiting',
      players: {
        [hostId]: {
          id: hostId,
          nickname: hostNickname,
          isReady: false, // Host also needs to submit a board
          board: [],
          marked: [],
          bingoCount: 0,
          isWinner: false,
        },
      },
      calledWords: [],
      turn: null,
      winners: [],
    };
    setGame(newGame);
  };

  const handleJoinRoom = (roomCode: string, nickname: string) => {
    if (!user) return;
    // In a real app, you'd fetch the game data from a server.
    // For this simulation, we'll assume a game object exists and we can join it.
    // This part is mostly for show in this single-player simulation.
    toast({
      title: "참여 기능",
      description: "실제 앱에서는 이 코드로 방에 참여합니다. 현재는 시뮬레이션입니다.",
    });

    // For demonstration, let's create a dummy game to join.
    const dummyGame: Game = {
      id: `game_${Math.random().toString(36).substr(2, 9)}`,
      hostId: 'dummy_host',
      roomCode: roomCode,
      topic: '시뮬레이션',
      size: 5,
      winCondition: 1,
      endCondition: 1,
      isRandomFillEnabled: true,
      randomWords: '가,나,다,라,마,바,사,아,자,차,카,타,파,하,거,너,더,러,머,버,서,어,저,처,커'.split(','),
      status: 'waiting',
      players: {
        'dummy_host': { id: 'dummy_host', nickname: '호스트', isReady: true, board: Array(25).fill(''), marked: Array(25).fill(false), bingoCount: 0, isWinner: false },
        [user.id]: { id: user.id, nickname: nickname, isReady: false, board: [], marked: [], bingoCount: 0, isWinner: false },
      },
      calledWords: [],
      turn: null,
      winners: [],
    }

    setIsHost(false);
    setUser(prev => ({...prev!, nickname}));
    setGame(dummyGame);
  };

  const handleSubmitBoard = (board: string[]) => {
    if (!game || !user) return;
    const marked = Array(game.size * game.size).fill(false);
    setGame(prevGame => {
      if (!prevGame) return null;
      const updatedPlayers = {
        ...prevGame.players,
        [user.id]: {
          ...prevGame.players[user.id],
          board,
          marked,
          isReady: true,
        },
      };
      return { ...prevGame, players: updatedPlayers };
    });
  };

  const handleStartGame = () => {
    if (!game || !isHost) return;
    const allPlayersReady = Object.values(game.players).every(p => p.isReady);
    if (!allPlayersReady) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "모든 참가자가 준비를 완료해야 시작할 수 있습니다.",
      });
      return;
    }
    
    // Shuffle players to determine turn order, including the host
    const playerIds = Object.keys(game.players);
    const shuffledPlayerIds = playerIds.sort(() => Math.random() - 0.5);

    setGame(prevGame => ({
      ...prevGame!,
      status: 'playing',
      turn: shuffledPlayerIds[0],
    }));
  };

  const handleCallWord = async (word: string) => {
    if (!game || !user || game.turn !== user.id || !word) return;
    
    setCoachFeedback(null); // Clear previous feedback

    const updates: Partial<Game> = {
      calledWords: [...game.calledWords, word],
      players: { ...game.players },
    };
    let newWinners = [...game.winners];

    for (const pid of Object.keys(game.players)) {
      const player = game.players[pid];
      const newMarked = [...player.marked];
      let changed = false;
      player.board.forEach((cellWord, index) => {
        if (cellWord.trim().toLowerCase() === word.trim().toLowerCase()) {
          if (!newMarked[index]) {
            newMarked[index] = true;
            changed = true;
          }
        }
      });

      if (changed) {
        const newBingoCount = checkBingo(newMarked, game.size).length;
        updates.players![pid] = { ...player, marked: newMarked, bingoCount: newBingoCount };

        if (newBingoCount >= game.winCondition && !player.isWinner) {
          updates.players![pid] = { ...updates.players![pid], isWinner: true };
          if(!newWinners.includes(player.nickname)) {
            newWinners.push(player.nickname);
          }
        }
      }
    }
    
    updates.winners = newWinners;

    if (newWinners.length >= game.endCondition) {
      updates.status = 'finished';
    } else {
        // Determine next turn
        const playerIds = Object.keys(game.players);
        const currentIndex = playerIds.indexOf(game.turn!);
        const nextIndex = (currentIndex + 1) % playerIds.length;
        updates.turn = playerIds[nextIndex];
    }
    
    setGame(prev => ({...prev!, ...updates}));
  };

  const handleGetCoachFeedback = async () => {
    if (!game || !user) return;

    // Get feedback for the player whose turn just ended.
    const playerIds = Object.keys(game.players);
    const prevTurnIndex = (playerIds.indexOf(game.turn!) - 1 + playerIds.length) % playerIds.length;
    const prevPlayerId = playerIds[prevTurnIndex];
    const prevPlayer = game.players[prevPlayerId];
    const calledWord = game.calledWords[game.calledWords.length - 1];

    if (!prevPlayer || !calledWord) {
      setCoachFeedback("피드백을 생성할 정보가 부족해요.");
      return;
    }

    setCoachFeedback("코칭 메시지를 생성하는 중...");

    const feedbackInput: FeedbackInput = {
      playerName: prevPlayer.nickname,
      bingoCount: prevPlayer.bingoCount,
      isWinner: prevPlayer.isWinner,
      calledWord: calledWord,
      remainingPlayers: Object.keys(game.players).length - game.winners.length,
      winCondition: game.winCondition,
    };
    
    const feedbackMessage = await generateFeedback(feedbackInput);
    setCoachFeedback(feedbackMessage);
  };

  const handleSetTurn = (playerId: string) => {
    if(!game || !isHost) return;
    setGame(prev => ({...prev!, turn: playerId}));
  }

  const handleBackToHome = () => {
    setGame(null);
    setIsHost(false);
    setCoachFeedback(null);
    setUser(prev => ({...prev!, nickname: ''}));
  }

  const renderScreen = () => {
    if (!game) {
      return <HomeScreen onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
    }
    switch (game.status) {
      case 'waiting':
        return <WaitingScreen game={game} userId={user!.id} isHost={isHost} onSubmitBoard={handleSubmitBoard} onStartGame={handleStartGame} />;
      case 'playing':
        return <GameScreen 
                  game={game} 
                  userId={user!.id} 
                  isHost={isHost} 
                  onCallWord={handleCallWord} 
                  onSetTurn={handleSetTurn}
                  coachFeedback={coachFeedback}
                  onGetCoachFeedback={handleGetCoachFeedback} 
                />;
      case 'finished':
        return <ResultScreen game={game} onBackToHome={handleBackToHome} />;
      default:
        return <HomeScreen onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
    }
  };

  return (
    <main className="container mx-auto p-4 font-body">
      {renderScreen()}
    </main>
  );
}
