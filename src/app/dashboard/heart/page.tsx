'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Smile, 
  Users, 
  TrendingUp, 
  Target, 
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface HEARTMetrics {
  overall_heart_score: number;
  happiness_csat: number;
  engagement: number;
  adoption: number;
  retention: number;
  task_success: number;
  total_analyzed: number;
  recent_analysis: any[];
}

export default function HEARTDashboard() {
  const [metrics, setMetrics] = useState<HEARTMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchHEARTData();
  }, []);

  const fetchHEARTData = async () => {
    try {
      const response = await fetch('/api/analyze/heart');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching HEART data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runHEARTAnalysis = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch('/api/analyze/heart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_mode: true })
      });
      
      if (response.ok) {
        await fetchHEARTData();
      }
    } catch (error) {
      console.error('Error running HEART analysis:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 4) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 3) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading HEART metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Heart className="h-8 w-8 text-red-500" />
                HEART Framework Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Google's comprehensive user experience metrics powered by AI
              </p>
            </div>
            <Button 
              onClick={runHEARTAnalysis} 
              disabled={analyzing}
              className="bg-red-600 hover:bg-red-700"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-2" />
                  Run HEART Analysis
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Overall HEART Score */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              Overall HEART Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(metrics?.overall_heart_score || 0)}`}>
                {metrics?.overall_heart_score?.toFixed(1) || '3.0'}
              </div>
              <p className="text-gray-600 mt-2">
                Based on {metrics?.total_analyzed || 0} analyzed feedback items
              </p>
            </div>
          </CardContent>
        </Card>

        {/* HEART Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Happiness (CSAT) */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Smile className="h-6 w-6 text-green-600" />
                {getScoreIcon(metrics?.happiness_csat || 0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Happiness (CSAT)</p>
                <p className={`text-2xl font-bold ${getScoreColor(metrics?.happiness_csat || 0)}`}>
                  {metrics?.happiness_csat?.toFixed(1) || '3.0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">User satisfaction</p>
              </div>
            </CardContent>
          </Card>

          {/* Engagement */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-6 w-6 text-blue-600" />
                {getScoreIcon(metrics?.engagement || 0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement</p>
                <p className={`text-2xl font-bold ${getScoreColor(metrics?.engagement || 0)}`}>
                  {metrics?.engagement?.toFixed(1) || '3.0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">User interaction</p>
              </div>
            </CardContent>
          </Card>

          {/* Adoption */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
                {getScoreIcon(metrics?.adoption || 0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Adoption</p>
                <p className={`text-2xl font-bold ${getScoreColor(metrics?.adoption || 0)}`}>
                  {metrics?.adoption?.toFixed(1) || '3.0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Feature usage</p>
              </div>
            </CardContent>
          </Card>

          {/* Retention */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Heart className="h-6 w-6 text-red-600" />
                {getScoreIcon(metrics?.retention || 0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Retention</p>
                <p className={`text-2xl font-bold ${getScoreColor(metrics?.retention || 0)}`}>
                  {metrics?.retention?.toFixed(1) || '3.0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">User loyalty</p>
              </div>
            </CardContent>
          </Card>

          {/* Task Success */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Target className="h-6 w-6 text-indigo-600" />
                {getScoreIcon(metrics?.task_success || 0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Task Success</p>
                <p className={`text-2xl font-bold ${getScoreColor(metrics?.task_success || 0)}`}>
                  {metrics?.task_success?.toFixed(1) || '3.0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Goal completion</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Analysis */}
        {metrics?.recent_analysis && metrics.recent_analysis.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent HEART Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.recent_analysis.slice(0, 5).map((analysis, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={analysis.actionable ? "default" : "secondary"}>
                          {analysis.category}
                        </Badge>
                        <Badge variant={analysis.priority === 'high' ? 'destructive' : 'outline'}>
                          {analysis.priority}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        Score: {analysis.overall_score.toFixed(1)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{analysis.main_point}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 