import { chromeSurface, ThemeContext } from '@react-foundry/style'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { resolveTarget, selectorOf, type Violation } from './a11y-scan'
import { accessibilityCheckerStyles } from './accessibility-checker.css'
import { Badge, type BadgeTone } from './badge'
import { Icon } from './icon/icon'
import { IconButton } from './icon-button'
import { Scrollable } from './scrollable'

interface AccessibilityCheckerProps {
  targetRef: React.RefObject<HTMLDivElement | null>
  isEnabled: boolean
  /** Pins the highlight to an element, or clears it when passed null. */
  onPin?: (target: HTMLElement | null) => void
  /** Previews the highlight while a locate button is hovered or focused. */
  onHover?: (target: HTMLElement | null) => void
  /** The currently pinned element, so its locate button can render as pressed. */
  pinnedTarget?: HTMLElement | null
  /**
   * Identity of whatever is on the canvas. When it changes the results no longer
   * describe what is on screen, so they are dropped and a fresh scan is queued.
   */
  scanKey?: unknown
}

/** Long enough for a preview to settle after a navigation or a control change. */
const SCAN_DEBOUNCE_MS = 500

interface RuleGroupProps {
  rule: Violation
  targetRef: React.RefObject<HTMLDivElement | null>
  onPin?: (target: HTMLElement | null) => void
  onHover?: (target: HTMLElement | null) => void
  pinnedTarget: HTMLElement | null
}

/** One axe rule and every node that tripped it, collapsed until opened. */
function RuleGroup({ rule, targetRef, onPin, onHover, pinnedTarget }: RuleGroupProps) {
  return (
    <details className={accessibilityCheckerStyles.violation}>
      <summary className={accessibilityCheckerStyles.violationSummary}>
        <div className={accessibilityCheckerStyles.violationHeader}>
          <span className={accessibilityCheckerStyles.violationTitle}>{rule.help}</span>
          <Badge tone={impactTone(rule.impact)}>{rule.impact}</Badge>
          <span className={accessibilityCheckerStyles.nodeCount}>
            {rule.nodes.length} instance{rule.nodes.length !== 1 ? 's' : ''}
          </span>
        </div>
      </summary>
      <div className={accessibilityCheckerStyles.violationDetails}>
        <p className={accessibilityCheckerStyles.description}>{rule.description}</p>
        <div className={accessibilityCheckerStyles.nodes}>
          {rule.nodes.map((node) => {
            // Resolved per render rather than stored: the canvas can re-render under us,
            // and a button that outlines nothing is worse than none.
            const target = resolveTarget(node.target, targetRef.current)
            const isPinned = target !== null && target === pinnedTarget

            return (
              <div
                key={selectorOf(node.target)}
                className={accessibilityCheckerStyles.node}
              >
                <div className={accessibilityCheckerStyles.nodeSelector}>
                  <span className={accessibilityCheckerStyles.nodeSelectorText}>
                    <code>{node.target.join(' > ')}</code>
                  </span>
                  {target && onPin && (
                    <IconButton
                      icon="Crosshair"
                      className={accessibilityCheckerStyles.locateButton}
                      title={isPinned ? 'Clear highlight' : 'Highlight in the preview'}
                      active={isPinned}
                      onClick={() => onPin(isPinned ? null : target)}
                      onPointerEnter={() => onHover?.(target)}
                      onPointerLeave={() => onHover?.(null)}
                      onFocus={() => onHover?.(target)}
                      onBlur={() => onHover?.(null)}
                    />
                  )}
                </div>
                <div className={accessibilityCheckerStyles.nodeMessage}>
                  {node.failureSummary}
                </div>
              </div>
            )
          })}
        </div>
        <a
          href={rule.helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={accessibilityCheckerStyles.helpLink}
        >
          Learn more →
        </a>
      </div>
    </details>
  )
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

export function AccessibilityChecker({
  targetRef,
  isEnabled,
  onPin,
  onHover,
  pinnedTarget = null,
  scanKey,
}: AccessibilityCheckerProps) {
  const [violations, setViolations] = useState<Violation[]>([])
  // axe's third bucket: rules it ran but could not reach a verdict on. Contrast lands
  // here whenever the element is outside the viewport, since the background color is
  // sampled by hit-testing and that only works on screen.
  const [incomplete, setIncomplete] = useState<Violation[]>([])
  /** Whether the canvas overflowed at scan time, so contrast covered only part of it. */
  const [canvasScrolls, setCanvasScrolls] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null)

  // Contrast is measured from rendered colors, so a theme flip invalidates the last scan.
  // Keyed on the resolved mode rather than the toolbar button, so following the system
  // into dark at sunset re-checks the same way clicking the toggle does. Read off the
  // context, not useTheme(), which throws where there is no provider.
  const resolvedTheme = useContext(ThemeContext)?.resolvedTheme

  // Held in a ref so clearing the pin does not depend on the caller memoizing `onPin`,
  // which would otherwise restart the debounced scan on every render.
  const onPinRef = useRef(onPin)
  useEffect(() => {
    onPinRef.current = onPin
  })

  const runAccessibilityCheck = useCallback(async () => {
    if (!targetRef.current || !isEnabled) return

    // Dropped up front rather than keyed off the new results: a scan re-resolves every
    // selector, so whatever is pinned may be detached by the time it finishes, and
    // watching `violations` for a change would rely on axe handing back a fresh array.
    onPinRef.current?.(null)
    setIsScanning(true)

    try {
      // Loaded on demand: axe-core is ~1MB and only needed once the checker is
      // enabled, so it stays out of the initial bundle as its own chunk.
      const { default: axe } = await import('axe-core')
      const results = await axe.run(targetRef.current)

      setViolations(results.violations as Violation[])
      // Defaulted because a stubbed axe in tests need not supply every bucket.
      setIncomplete((results.incomplete ?? []) as Violation[])

      // axe matches color-contrast on `isVisibleOnScreen`, which treats anything scrolled
      // outside an overflow ancestor as hidden, so contrast covers only what was on screen.
      const canvas = targetRef.current
      setCanvasScrolls(canvas ? canvas.scrollHeight > canvas.clientHeight + 1 : false)
      setLastScanTime(new Date())
    } catch {
      // Silently fail - accessibility checking is non-critical
    } finally {
      setIsScanning(false)
    }
  }, [targetRef, isEnabled])

  // Results describe one canvas. Once that changes, a leftover count in the header would
  // be describing a preview that is no longer on screen, so drop them.
  useEffect(() => {
    setViolations([])
    setIncomplete([])
    setLastScanTime(null)
    onPinRef.current?.(null)
  }, [scanKey, isEnabled])

  // Collapsed means the results are off screen, so scanning then is work nobody can see;
  // expanding is what triggers the catch-up. The debounce also gives a theme flip time to
  // travel through the consumer's provider and repaint before axe reads colors back.
  useEffect(() => {
    if (!isEnabled || !isExpanded) return

    const timeout = setTimeout(() => void runAccessibilityCheck(), SCAN_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [isEnabled, isExpanded, scanKey, resolvedTheme, runAccessibilityCheck])

  const countNodes = (rules: Violation[]) =>
    rules.reduce((sum, rule) => sum + rule.nodes.length, 0)

  const totalViolations = countNodes(violations)
  const totalIncomplete = countNodes(incomplete)

  return (
    <div
      className={`${chromeSurface} ${accessibilityCheckerStyles.container}`}
      data-open={isEnabled}
      data-expanded={isExpanded}
      aria-hidden={!isEnabled}
    >
      <div className={accessibilityCheckerStyles.header}>
        <button
          type="button"
          className={accessibilityCheckerStyles.toggleButton}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <Icon name="CaretRight" rotate={isExpanded ? '90' : '270'} size={'sm'} />
          <span className={accessibilityCheckerStyles.title}>Accessibility Check</span>
          {resolvedTheme && (
            <span
              className={accessibilityCheckerStyles.themeLabel}
              title="Contrast results describe the active theme only"
            >
              {resolvedTheme}
            </span>
          )}
          {isScanning ? (
            <span className={accessibilityCheckerStyles.scanningIndicator}>
              Scanning...
            </span>
          ) : (
            <span className={accessibilityCheckerStyles.headerStatus}>
              {violations.length > 0 && (
                <Badge tone="danger">
                  {violations.length} issue{violations.length !== 1 ? 's' : ''} (
                  {totalViolations} instance
                  {totalViolations !== 1 ? 's' : ''})
                </Badge>
              )}
              {/* Only a clean sweep counts as passing. Saying "Passed" next to results
                  axe could not reach a verdict on would overstate what was checked. */}
              {violations.length === 0 && incomplete.length === 0 && lastScanTime && (
                <span className={accessibilityCheckerStyles.passedIndicator}>
                  <Icon name="Circle" weight="fill" size={'sm'} />
                  Passed
                </span>
              )}
              {incomplete.length > 0 && (
                <Badge tone="caution">{totalIncomplete} unchecked</Badge>
              )}
            </span>
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

      {/* Stays mounted while collapsed so the height has something to animate against.
          `inert` keeps the clipped controls out of the tab order and off screen readers,
          which `overflow: hidden` alone does not do. */}
      {isEnabled && (
        <Scrollable className={accessibilityCheckerStyles.content} inert={!isExpanded}>
          {canvasScrolls && lastScanTime && (
            <p className={accessibilityCheckerStyles.scopeNote}>
              Contrast was only measured for the part of the canvas on screen. Scroll the
              rest into view and re-run to check it.
            </p>
          )}

          {violations.length === 0 &&
            incomplete.length === 0 &&
            !isScanning &&
            lastScanTime && (
              <div className={accessibilityCheckerStyles.noViolations}>
                <Icon name="Circle" weight="fill" size={'sm'} />
                <span>No accessibility violations detected!</span>
              </div>
            )}

          {violations.map((rule) => (
            <RuleGroup
              key={rule.id}
              rule={rule}
              targetRef={targetRef}
              onPin={onPin}
              onHover={onHover}
              pinnedTarget={pinnedTarget}
            />
          ))}

          {incomplete.length > 0 && (
            <div className={accessibilityCheckerStyles.section}>
              <h3 className={accessibilityCheckerStyles.sectionHeading}>
                Could not be checked
              </h3>
              <p className={accessibilityCheckerStyles.sectionNote}>
                axe ran these rules but could not reach a verdict. Contrast lands here
                when an element is off screen, because the background color is sampled by
                hit-testing the point it sits at. Scroll it into view and re-run.
              </p>
              {incomplete.map((rule) => (
                <RuleGroup
                  key={rule.id}
                  rule={rule}
                  targetRef={targetRef}
                  onPin={onPin}
                  onHover={onHover}
                  pinnedTarget={pinnedTarget}
                />
              ))}
            </div>
          )}
        </Scrollable>
      )}
    </div>
  )
}
