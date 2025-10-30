
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Database, DollarSign } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: TrendingUp,
      title: "Real-Time Market Analysis",
      description: "Advanced algorithms analyze market trends, sentiment, and technical indicators in real-time to identify optimal investment opportunities.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Database,
      title: "Big Data Processing",
      description: "Process millions of data points from global markets, news sources, and economic indicators to make informed investment decisions.",
      color: "from-emerald-500 to-emerald-600"
    },
    {
      icon: DollarSign,
      title: "Risk Assessment",
      description: "Comprehensive risk analysis using machine learning models to evaluate potential downsides and optimize portfolio allocation.",
      color: "from-amber-500 to-amber-600"
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Why Choose InvestAI?
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Our AI-powered platform combines cutting-edge technology with financial expertise 
            to deliver superior investment insights.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-slate-200">
              <CardContent className="p-8 text-center">
                <div className={`bg-gradient-to-r ${feature.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
