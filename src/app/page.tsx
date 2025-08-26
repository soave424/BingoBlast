'use client';

import type { Game, Player, GameStatus } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { HomeScreen } from '@/components/screens/HomeScreen';
import { WaitingScreen } from '@/components/screens/WaitingScreen';
import { GameScreen } from '@/components/screens/GameScreen';
import { ResultScreen } from '@/components/screens/ResultScreen';
import { useToast } from '@/hooks/use-toast';
import { generateFeedback } from '@/app/actions';
import type { FeedbackInput } from '@/ai/flows/positive-feedback';
import { createRoom, joinRoom, getGame, submitBoard, startGame, callWord, setTurn, requestWordApproval, resolveWordRequest } from '@/app/game-actions';

// Generate a unique session ID for the user
const getSessionId = () => {
  if (typeof window !== 'undefined') {
    let sessionId = sessionStorage.getItem('bingoSessionId');
    if (!sessionId) {
      sessionId = `user_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('bingoSessionId', sessionId);
    }
    return sessionId;
  }
  return `server_user_${Math.random().toString(36).substr(2, 9)}`;
};

export default function Home() {
  const [game, setGame] = useState<Game | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [coachFeedback, setCoachFeedback] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const id = getSessionId();
    setUserId(id);
    const savedIsHost = sessionStorage.getItem('isHost');
    setIsHost(savedIsHost === 'true');
  }, []);
  
  const handleGameUpdate = useCallback((newGame: Game | null) => {
    if (newGame) {
      setGame(newGame);
    } else {
      setGame(null);
       toast({
        variant: "destructive",
        title: "오류",
        description: "게임 정보를 불러오는 데 실패했습니다.",
      });
    }
  }, [toast]);

  // Polling for game updates
  useEffect(() => {
    if (!game?.id || game.status === 'finished') return;
    
    const interval = setInterval(async () => {
      const updatedGame = await getGame(game.id);
      if (updatedGame && JSON.stringify(updatedGame) !== JSON.stringify(game)) {
        setGame(updatedGame);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [game]);
  
  const handleCreateRoom = async (
    topic: string,
    size: number,
    winCondition: number,
    endCondition: number,
    isRandomFillEnabled: boolean,
    randomWords: string[]
  ) => {
    const hostId = userId;
    // For hosts, let's use a fixed nickname or one they can set. Here, '호스트' is used.
    // In a real app, you might have a nickname input for the host too.
    const hostNickname = '호스트'; 
    
    const newGame = await createRoom({
      hostId,
      hostNickname,
      topic,
      size,
      winCondition,
      endCondition,
      isRandomFillEnabled,
      randomWords
    });

    if (newGame) {
      setIsHost(true);
      sessionStorage.setItem('isHost', 'true');
      handleGameUpdate(newGame);
    } else {
      toast({ variant: 'destructive', title: '오류', description: '방을 만들지 못했습니다.'});
    }
  };

  const handleJoinRoom = async (roomCode: string, nickname: string) => {
    if (!userId) return;

    const result = await joinRoom(roomCode, userId, nickname);
    if(result.error) {
        toast({ variant: "destructive", title: "오류", description: result.error });
    } else {
        setIsHost(false);
        sessionStorage.setItem('isHost', 'false');
        handleGameUpdate(result.game);
    }
  };

  const handleSubmitBoard = async (board: string[]) => {
    if (!game || !userId) return;
    
    const trimmedBoard = board.map(cell => cell.trim().toLowerCase()).filter(Boolean);
    const uniqueWords = new Set(trimmedBoard);
    if (uniqueWords.size !== trimmedBoard.length) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "빙고판에 중복된 단어가 있습니다. 다시 작성해주세요.",
      });
      return;
    }

    const updatedGame = await submitBoard(game.id, userId, board);
    handleGameUpdate(updatedGame);
  };

  const handleStartGame = async () => {
    if (!game || !isHost) return;
    
    const result = await startGame(game.id);
    if (result.error) {
       toast({ variant: "destructive", title: "오류", description: result.error });
    } else {
      handleGameUpdate(result.game);
    }
  };

  const handleCallWord = async (word: string) => {
    if (!game || !userId || game.turn !== userId || !word) return;
    
    setCoachFeedback(null); // Clear previous feedback
    const updatedGame = await callWord(game.id, userId, word);
    handleGameUpdate(updatedGame);
  };

  const handleGetCoachFeedback = async () => {
    if (!game || !userId) return;

    // Get feedback for the player whose turn just ended.
    const playerIds = Object.keys(game.players).filter(id => id !== game.hostId);
    let prevPlayerId = game.turn!;
    if (game.calledWords.length > 0) {
        const currentIndex = playerIds.indexOf(game.turn!);
        const prevTurnIndex = (currentIndex - 1 + playerIds.length) % playerIds.length;
        prevPlayerId = playerIds[prevTurnIndex];
    }
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
      remainingPlayers: Object.keys(game.players).length - 1 - game.winners.length,
      winCondition: game.winCondition,
    };
    
    const feedbackMessage = await generateFeedback(feedbackInput);
    setCoachFeedback(feedbackMessage);
  };

  const handleSetTurn = async (playerId: string) => {
    if(!game || !isHost) return;
    const updatedGame = await setTurn(game.id, playerId);
    handleGameUpdate(updatedGame);
  }

  const handleRequestWordApproval = async (word: string, index: number) => {
    if (!game || !userId) return;
    const result = await requestWordApproval(game.id, userId, word, index);
    if (result.error) {
      toast({ variant: 'destructive', title: '오류', description: result.error });
    } else {
      toast({ title: '성공', description: `'${word}' 단어의 인정을 호스트에게 요청했습니다.` });
      handleGameUpdate(result.game);
    }
  };

  const handleResolveWordRequest = async (requestId: string, approve: boolean) => {
    if (!game || !isHost) return;
    const updatedGame = await resolveWordRequest(game.id, requestId, approve);
    handleGameUpdate(updatedGame);
  };

  const handleBackToHome = () => {
    setGame(null);
    setIsHost(false);
    setCoachFeedback(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('bingoSessionId');
      sessionStorage.removeItem('isHost');
      setUserId(getSessionId());
    }
  }

  const renderScreen = () => {
    if (!game) {
      return <HomeScreen onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
    }
    switch (game.status) {
      case 'waiting':
        return <WaitingScreen game={game} userId={userId} isHost={isHost} onSubmitBoard={handleSubmitBoard} onStartGame={handleStartGame} />;
      case 'playing':
        return <GameScreen 
                  game={game} 
                  userId={userId} 
                  isHost={isHost} 
                  onCallWord={handleCallWord} 
                  onSetTurn={handleSetTurn}
                  coachFeedback={coachFeedback}
                  onGetCoachFeedback={handleGetCoachFeedback}
                  onRequestWordApproval={handleRequestWordApproval}
                  onResolveWordRequest={handleResolveWordRequest}
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
