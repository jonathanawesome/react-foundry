import axe, { type NodeResult } from 'axe-core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { accessibilityCheckerStyles } from './accessibility-checker.css'
import { Badge, type BadgeTone } from './badge'
import { Icon } from './icon/icon'

interface AccessibilityCheckerProps {
  targetRef: React.RefObject<HTMLDivElement | null>
  isEnabled: boolean
  isShelfOpen?: boolean
  isPanelOpen?: boolean
}

/** Maps an axe impact level to the badge tone used to show it. */
export function impactTone(impact: string | null): BadgeTone {
  switch (impact) {
    case 'critical':
      return 'danger'
    case 'serious':
      return 'warning'
    case 'moderate':
      return 'caution'
    case 'minor':
      return 'info'
    default:
      return 'neutral'
  }
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
  isPanelOpen = false,
}: AccessibilityCheckerProps) {
  const [violations, setViolations] = useState<Violation[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null)
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

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

  const totalViolations = violations.reduce(
    (sum, violation) => sum + violation.nodes.length,
    0
  )

  // Width tracks the shelf/panel regardless of open state, so toggling the
  // checker is a pure vertical slide rather than a width change.
  const containerClass = [
    accessibilityCheckerStyles.container,
    isShelfOpen && accessibilityCheckerStyles.containerWithShelf,
    isPanelOpen && accessibilityCheckerStyles.containerWithPanel,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClass} data-open={isEnabled} aria-hidden={!isEnabled}>
      <div className={accessibilityCheckerStyles.header}>
        <button
          type="button"
          className={accessibilityCheckerStyles.toggleButton}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <Icon name="CaretRight" rotate={isExpanded ? '90' : '270'} size={'sm'} />
          <span className={accessibilityCheckerStyles.title}>Accessibility Check</span>
          {isScanning ? (
            <span className={accessibilityCheckerStyles.scanningIndicator}>
              Scanning...
            </span>
          ) : (
            <>
              {violations.length > 0 && (
                <Badge tone="danger" className={accessibilityCheckerStyles.pushRight}>
                  {violations.length} issue{violations.length !== 1 ? 's' : ''} (
                  {totalViolations} instance
                  {totalViolations !== 1 ? 's' : ''})
                </Badge>
              )}
              {violations.length === 0 && lastScanTime && (
                <span className={accessibilityCheckerStyles.passedIndicator}>
                  <Icon name="Circle" weight="fill" size={'sm'} />
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
              <Icon name="Circle" weight="fill" size={'sm'} />
              <span>No accessibility violations detected!</span>
            </div>
          )}

          {violations.map((violation) => (
            <details key={violation.id} className={accessibilityCheckerStyles.violation}>
              <summary className={accessibilityCheckerStyles.violationSummary}>
                <div className={accessibilityCheckerStyles.violationHeader}>
                  <span className={accessibilityCheckerStyles.violationTitle}>
                    {violation.help}
                  </span>
                  <Badge tone={impactTone(violation.impact)}>{violation.impact}</Badge>
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
