import { AssessmentForm } from "@/components/ai/AssessmentForm";

export default function AITestPage() {
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-serif font-bold text-niramayah-navy">Cardiac Risk Assessment</h1>
        <p className="text-niramayah-gray mt-2">
          Complete this screening to receive your personalized risk analysis.
        </p>
        <div className="inline-block mt-4 bg-niramayah-orange/10 border border-niramayah-orange/20 text-niramayah-orange text-xs px-3 py-1.5 rounded-md">
          <strong>Important:</strong> This is a pre-diagnostic tool and not a substitute for professional medical advice.
        </div>
      </div>
      
      <AssessmentForm />
    </div>
  );
}
