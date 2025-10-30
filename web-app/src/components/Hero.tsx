import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Database, DollarSign } from "lucide-react";

const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 text-white py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-500/20 text-blue-200 border-blue-400/30">
            Powered by Advanced AI
          </Badge>
          
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            AI-Powered Investment Analysis
          </h1>
          
          <p className="text-xl lg:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Unlock superior investment opportunities with our cutting-edge artificial intelligence platform. 
            Make data-driven decisions with confidence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-lg px-8 py-3">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-3">
              Watch Demo
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">98% Accuracy</h3>
              <p className="text-slate-400">Market prediction accuracy</p>
            </div>
            
            <div className="text-center">
              <div className="bg-emerald-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="h-8 w-8 text-emerald-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">10M+ Data Points</h3>
              <p className="text-slate-400">Analyzed daily</p>
            </div>
            
            <div className="text-center">
              <div className="bg-yellow-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-yellow-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">$2.5B+</h3>
              <p className="text-slate-400">Assets under management</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
