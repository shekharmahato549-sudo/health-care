'use client'

import { useState } from 'react'
import { useAuth } from '@/app/lib/auth-context'
import { ProtectedRoute } from '@/app/components/ProtectedRoute'
import { supabase } from '@/app/lib/supabase'
import useSWR from 'swr'

const commonSymptoms = [
  'Headache', 'Fever', 'Cough', 'Sore Throat', 'Fatigue',
  'Body Aches', 'Nausea', 'Vomiting', 'Diarrhea', 'Shortness of Breath',
  'Chest Pain', 'Dizziness', 'Chills', 'Congestion', 'Runny Nose'
]

const fetcher = async (url: string) => {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${session?.access_token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function SymptomChecker() {
  const { user } = useAuth()
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [duration, setDuration] = useState('')
  const [severity, setSeverity] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { data: history } = useSWR('/api/symptoms/history', fetcher)

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    )
  }

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0) {
      alert('Please select at least one symptom')
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          symptoms: selectedSymptoms,
          duration,
          severity,
          additional_info: additionalInfo
        })
      })

      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setResult(data)
    } catch (error) {
      alert('Failed to analyze symptoms. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="patient">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">AI Symptom Checker</h1>
            <p className="text-gray-600 mt-2">Describe your symptoms for AI-powered analysis</p>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              ⚠️ This tool is for informational purposes only. Please consult a healthcare professional for diagnosis.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Panel */}
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Your Symptoms</h2>
                
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Common Symptoms</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {commonSymptoms.map(symptom => (
                      <button
                        key={symptom}
                        onClick={() => toggleSymptom(symptom)}
                        className={`p-3 rounded-lg text-sm font-medium transition ${
                          selectedSymptoms.includes(symptom)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {symptom}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How long have you had these symptoms?
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="input"
                  >
                    <option value="">Select duration</option>
                    <option value="less_than_1_day">Less than 1 day</option>
                    <option value="1_3_days">1-3 days</option>
                    <option value="4_7_days">4-7 days</option>
                    <option value="1_2_weeks">1-2 weeks</option>
                    <option value="more_than_2_weeks">More than 2 weeks</option>
                  </select>
                </div>

                {/* Severity */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symptom Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="input"
                  >
                    <option value="">Select severity</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>

                {/* Additional Info */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Information (optional)
                  </label>
                  <textarea
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    className="input"
                    rows={4}
                    placeholder="Any other details that might be relevant..."
                  />
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={loading || selectedSymptoms.length === 0}
                  className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {loading ? 'Analyzing...' : 'Analyze Symptoms'}
                </button>
              </div>
            </div>

            {/* Results Panel */}
            <div>
              {result ? (
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Analysis Results</h2>
                  
                  {result.ai_analysis?.urgent_warning && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                      ⚠️ URGENT: This requires immediate medical attention. Please contact emergency services or visit an ER.
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Possible Conditions</h3>
                      <ul className="mt-2 space-y-1">
                        {result.suggested_conditions?.map((condition: string, idx: number) => (
                          <li key={idx} className="text-sm text-gray-700">
                            • {condition} {result.confidence_scores?.[condition] && 
                              <span className="text-gray-500">({Math.round(result.confidence_scores[condition] * 100)}%)</span>
                            }
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">Recommendations</h3>
                      <p className="mt-2 text-sm text-gray-700">{result.recommendations}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">When to See a Doctor</h3>
                      <p className="mt-2 text-sm text-gray-700">{result.ai_analysis?.when_to_seek_help}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card text-center text-gray-600">
                  <p className="text-lg">Results will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          {history && history.length > 0 && (
            <div className="card mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Symptom Check History</h2>
              <div className="space-y-2">
                {history.slice(0, 5).map((check: any) => (
                  <div key={check.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">
                      {check.symptoms.join(', ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(check.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
