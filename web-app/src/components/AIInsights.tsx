
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

const AIInsights = () => {
  const insights = [
    {
      title: "Technology Sector Bullish Signal",
      confidence: 94,
      type: "bullish",
      description: "AI models detect strong momentum in cloud computing and AI infrastructure stocks. Recommended allocation increase of 5-8%.",
      timeframe: "Next 30 days",
      impact: "High"
    },
    {
      title: "Energy Sector Volatility Warning",
      confidence: 87,
      type: "bearish",
      description: "Geopolitical tensions and supply chain disruptions indicate potential 15-20% correction in energy stocks.",
      timeframe: "Next 14 days",
      impact: "Medium"
    },
    {
      title: "Healthcare Innovation Opportunity",
      confidence: 91,
      type: "bullish",
      description: "Breakthrough in gene therapy trials shows 80% success rate. Target healthcare biotech subsector for growth.",
      timeframe: "Next 60 days",
      impact: "High"
    }
  ];

  const marketSentiment = [
    { indicator: "Social Media Sentiment", value: 78, trend: "positive" },
    { indicator: "News Analysis", value: 65, trend: "neutral" },
    { indicator: "Options Flow", value: 82, trend: "positive" },
    { indicator: "Institutional Activity", value: 71, trend: "positive" }
  ];

  return (
    <section id="insights" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            AI Investment Insights
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Real-time AI analysis providing actionable investment recommendations 
            based on market patterns and sentiment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {insights.map((insight, index) => (
            <Card key={index} className="border-slate-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge 
                    className={`${
                      insight.type === 'bullish' 
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                        : 'bg-red-100 text-red-700 border-red-200'
                    }`}
                  >
                    {insight.type === 'bullish' ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {insight.type.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-semibold text-slate-900">
                    {insight.confidence}% Confidence
                  </span>
                </div>
                <CardTitle className="text-lg text-slate-900">{insight.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">{insight.description}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Timeframe: {insight.timeframe}</span>
                  <span className={`font-semibold ${
                    insight.impact === 'High' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {insight.impact} Impact
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900">Market Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {marketSentiment.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="mb-3">
                    <div className="text-2xl font-bold text-slate-900 mb-1">{item.value}%</div>
                    <div className="flex items-center justify-center">
                      {item.trend === 'positive' ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
                      ) : item.trend === 'negative' ? (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      ) : (
                        <div className="h-4 w-4 bg-slate-400 rounded-full mr-1" />
                      )}
                      <span className={`text-sm capitalize ${
                        item.trend === 'positive' ? 'text-emerald-500' : 
                        item.trend === 'negative' ? 'text-red-500' : 'text-slate-500'
                      }`}>
                        {item.trend}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{item.indicator}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AIInsights;
