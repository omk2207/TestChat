"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function SetupPage() {
  const [dbStatus, setDbStatus] = useState<"loading" | "success" | "error" | null>(null)
  const [dbMessage, setDbMessage] = useState<string>("")
  const [dbConfig, setDbConfig] = useState<any>(null)
  const [setupComplete, setSetupComplete] = useState<boolean>(false)
  const [setupRunning, setSetupRunning] = useState<boolean>(false)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Add a new state for diagnostics
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false)

  const testDatabaseConnection = async () => {
    setDbStatus("loading")
    try {
      const response = await fetch("/api/test-db")
      const data = await response.json()

      if (data.status === "success") {
        setDbStatus("success")
        setDbMessage(data.message)
        setDbConfig(data.config)
      } else {
        setDbStatus("error")
        setDbMessage(data.message)
      }
    } catch (error) {
      setDbStatus("error")
      setDbMessage("Failed to connect to the database. Check your environment variables.")
    }
  }

  const runDatabaseSetup = async () => {
    setSetupRunning(true)
    setSetupError(null)

    try {
      const response = await fetch("/api/setup-db", {
        method: "POST",
      })

      const data = await response.json()

      if (data.status === "success") {
        setSetupComplete(true)
      } else {
        setSetupError(data.message || "Failed to set up database tables")
      }
    } catch (error) {
      setSetupError("An error occurred during setup")
    } finally {
      setSetupRunning(false)
    }
  }

  const fetchDebugInfo = async () => {
    try {
      const response = await fetch("/api/debug")
      if (response.ok) {
        const data = await response.json()
        setDebugInfo(data)
      }
    } catch (error) {
      console.error("Failed to fetch debug info:", error)
    }
  }

  // Add a new function to run diagnostics
  const runDiagnostics = async () => {
    setLoadingDiagnostics(true)
    try {
      const response = await fetch("/api/diagnostics")
      const data = await response.json()
      setDiagnostics(data)
    } catch (error) {
      console.error("Failed to run diagnostics:", error)
    } finally {
      setLoadingDiagnostics(false)
    }
  }

  useEffect(() => {
    testDatabaseConnection()
    if (process.env.NODE_ENV !== "production") {
      fetchDebugInfo()
    }
  }, [])

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Chat Application Setup</CardTitle>
          <CardDescription>Configure your database and initialize the application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="font-medium">Database Connection</div>
            {dbStatus === "loading" && (
              <div className="flex items-center text-sm text-gray-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing database connection...
              </div>
            )}

            {dbStatus === "success" && (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle>Connected</AlertTitle>
                <AlertDescription className="text-sm">
                  {dbMessage}
                  {dbConfig && (
                    <div className="mt-2 text-xs">
                      <div>Host: {dbConfig.host}</div>
                      <div>User: {dbConfig.user}</div>
                      <div>Database: {dbConfig.database}</div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {dbStatus === "error" && (
              <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertTitle>Connection Failed</AlertTitle>
                <AlertDescription className="text-sm">
                  {dbMessage}
                  <div className="mt-2">
                    Please check your environment variables:
                    <ul className="list-disc list-inside text-xs mt-1">
                      <li>DB_HOST (usually 'localhost' for shared hosting)</li>
                      <li>DB_USER</li>
                      <li>DB_PASSWORD or DB_PASS</li>
                      <li>DB_NAME</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {dbStatus === "success" && !setupComplete && (
            <div className="space-y-2">
              <div className="font-medium">Database Setup</div>
              <p className="text-sm text-gray-500">Create the necessary tables for the chat application.</p>
              {setupError && (
                <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertTitle>Setup Failed</AlertTitle>
                  <AlertDescription className="text-sm">{setupError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {setupComplete && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle>Setup Complete</AlertTitle>
              <AlertDescription className="text-sm">Your chat application is ready to use!</AlertDescription>
            </Alert>
          )}

          {!setupComplete && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={runDiagnostics}
                disabled={loadingDiagnostics}
                className="w-full"
              >
                {loadingDiagnostics ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Diagnostics...
                  </>
                ) : (
                  "Run Diagnostics"
                )}
              </Button>

              {diagnostics && (
                <div className="mt-4 text-xs">
                  <details className="cursor-pointer">
                    <summary className="font-medium">Diagnostic Results</summary>
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(diagnostics, null, 2)}</pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}

          {debugInfo && process.env.NODE_ENV !== "production" && (
            <div className="mt-4">
              <details className="text-xs">
                <summary className="cursor-pointer font-medium">Debug Information</summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={testDatabaseConnection} disabled={dbStatus === "loading"}>
            {dbStatus === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Test Connection
              </>
            )}
          </Button>

          {dbStatus === "success" && !setupComplete && (
            <Button onClick={runDatabaseSetup} disabled={setupRunning}>
              {setupRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Set Up Database"
              )}
            </Button>
          )}

          {setupComplete && (
            <Link href="/login">
              <Button>Go to Login</Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

