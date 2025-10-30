
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

const Dashboard = () => {
  const portfolioData = [
    { month: 'Jan', value: 100000, benchmark: 100000 },
    { month: 'Feb', value: 108000, benchmark: 103000 },
    { month: 'Mar', value: 112000, benchmark: 105000 },
    { month: 'Apr', value: 118000, benchmark: 107000 },
    { month: 'May', value: 125000, benchmark: 110000 },
    { month: 'Jun', value: 132000, benchmark: 112000 },
  ];

  const sectorData = [
    { sector: 'Technology', allocation: 35, performance: 12.5 },
    { sector: 'Healthcare', allocation: 20, performance: 8.3 },
    { sector: 'Finance', allocation: 18, performance: 6.7 },
    { sector: 'Energy', allocation: 15, performance: -2.1 },
    { sector: 'Consumer', allocation: 12, performance: 4.2 },
  ];

  const metrics = [
    { title: "Total Return", value: "+32.0%", change: "+2.4%", trend: "up" },
    { title: "Sharpe Ratio", value: "1.85", change: "+0.12", trend: "up" },
    { title: "Max Drawdown", value: "-4.2%", change: "-1.1%", trend: "down" },
    { title: "Alpha", value: "0.08", change: "+0.03", trend: "up" },
  ];

  return (
    <section id="dashboard" className="py-20 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Performance Dashboard
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Real-time portfolio performance and analytics powered by our AI engine.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card key={index} className="bg-white border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">{metric.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                    <div className="flex items-center mt-2">
                      {metric.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${metric.trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Portfolio Performance vs Benchmark</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={portfolioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px' 
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    name="Portfolio"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="benchmark" 
                    stroke="#64748b" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    name="Benchmark"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Sector Allocation & Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="sector" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px' 
                    }} 
                  />
                  <Bar dataKey="allocation" fill="#3b82f6" name="Allocation %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
