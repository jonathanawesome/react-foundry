import { useLocation } from '@tanstack/react-router'
import axe, { type NodeResult } from 'axe-core'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Icon } from '../icon/icon'

import { accessibilityCheckerStyles } from './accessibility-checker.css'

interface AccessibilityCheckerProps {
  targetRef: React.RefObject<HTMLDivElement | null>
  isEnabled: boolean
  isShelfOpen?: boolean
}

interface Violation {
  id: string
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null
  description: string
  help: string
  helpUrl: string
  nodes: NodeResult[]
}

export function AccessibilityChecker({
  targetRef,
  isEnabled,
  isShelfOpen = false,
}: AccessibilityCheckerProps) {
  const [violations, setViolations] = useState<Violation[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null)
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const _location = useLocation()

  const runAccessibilityCheck = useCallback(async () => {
    if (!targetRef.current || !isEnabled) return

    setIsScanning(true)

    try {
      const results = await axe.run(targetRef.current)

      setViolations(results.violations as Violation[])
      setLastScanTime(new Date())
    } catch {
      // Silently fail - accessibility checking is non-critical
    } finally {
      setIsScanning(false)
    }
  }, [targetRef, isEnabled])

  useEffect(() => {
    if (!isEnabled) {
      setViolations([])
      return
    }

    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
    }

    // Debounce the scan to avoid performance issues
    scanTimeoutRef.current = setTimeout(() => {
      void runAccessibilityCheck()
    }, 500)

    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current)
      }
    }
  }, [isEnabled, runAccessibilityCheck])

  if (!isEnabled) return null

  const getImpactColor = (impact: string | null) => {
    switch (impact) {
      case 'critical':
        return accessibilityCheckerStyles.impactCritical
      case 'serious':
        return accessibilityCheckerStyles.impactSerious
      case 'moderate':
        return accessibilityCheckerStyles.impactModerate
      case 'minor':
        return accessibilityCheckerStyles.impactMinor
      default:
        return ''
    }
  }

  const totalViolations = violations.reduce(
    (sum, violation) => sum + violation.nodes.length,
    0
  )

  return (
    <div
      className={`${accessibilityCheckerStyles.container} ${isShelfOpen ? accessibilityCheckerStyles.containerWithShelf : ''}`}
    >
      <div className={accessibilityCheckerStyles.header}>
        <button
          type="button"
          className={accessibilityCheckerStyles.toggleButton}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <Icon name="Chevron" rotate={isExpanded ? undefined : '270'} />
          <span className={accessibilityCheckerStyles.title}>Accessibility Check</span>
          {isScanning ? (
            <span className={accessibilityCheckerStyles.scanningIndicator}>
              Scanning...
            </span>
          ) : (
            <>
              {violations.length > 0 && (
                <span className={accessibilityCheckerStyles.violationCount}>
                  {violations.length} issue{violations.length !== 1 ? 's' : ''} (
                  {totalViolations} instance
                  {totalViolations !== 1 ? 's' : ''})
                </span>
              )}
              {violations.length === 0 && lastScanTime && (
                <span className={accessibilityCheckerStyles.passedIndicator}>
                  <Icon name="CircleFill" />
                  Passed
                </span>
              )}
            </>
          )}
        </button>
        <button
          type="button"
          className={accessibilityCheckerStyles.rescanButton}
          onClick={() => void runAccessibilityCheck()}
          disabled={isScanning}
          title="Re-run accessibility check"
        >
          re-run check
        </button>
      </div>

      {isExpanded && (
        <div className={accessibilityCheckerStyles.content}>
          {violations.length === 0 && !isScanning && lastScanTime && (
            <div className={accessibilityCheckerStyles.noViolations}>
              <Icon name="CircleFill" />
              <span>No accessibility violations detected!</span>
            </div>
          )}

          {violations.map((violation) => (
            <details key={violation.id} className={accessibilityCheckerStyles.violation}>
              <summary className={accessibilityCheckerStyles.violationSummary}>
                <div className={accessibilityCheckerStyles.violationHeader}>
                  <span className={getImpactColor(violation.impact)}>
                    <Icon name="CircleFill" />
                  </span>
                  <span className={accessibilityCheckerStyles.violationTitle}>
                    {violation.help}
                  </span>
                  <span
                    className={`${accessibilityCheckerStyles.impact} ${getImpactColor(
                      violation.impact
                    )}`}
                  >
                    {violation.impact}
                  </span>
                  <span className={accessibilityCheckerStyles.nodeCount}>
                    {violation.nodes.length} instance
                    {violation.nodes.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </summary>
              <div className={accessibilityCheckerStyles.violationDetails}>
                <p className={accessibilityCheckerStyles.description}>
                  {violation.description}
                </p>
                <div className={accessibilityCheckerStyles.nodes}>
                  {violation.nodes.map((node) => (
                    <div
                      key={node.target.join('>')}
                      className={accessibilityCheckerStyles.node}
                    >
                      <div className={accessibilityCheckerStyles.nodeSelector}>
                        <code>{node.target.join(' > ')}</code>
                      </div>
                      <div className={accessibilityCheckerStyles.nodeMessage}>
                        {node.failureSummary}
                      </div>
                    </div>
                  ))}
                </div>
                <a
                  href={violation.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={accessibilityCheckerStyles.helpLink}
                >
                  Learn more →
                </a>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
