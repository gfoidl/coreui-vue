import { defineComponent, h, PropType, ref, RendererElement, Teleport, Transition } from 'vue'
import { createPopper, Placement } from '@popperjs/core'

import { executeAfterTransition } from '../../utils/transition'
import { isRTL } from '../../utils'

const getPlacement = (placement: string, element: HTMLDivElement | null): Placement => {
  switch (placement) {
    case 'right': {
      return isRTL(element) ? 'left' : 'right'
    }
    case 'left': {
      return isRTL(element) ? 'right' : 'left'
    }
    default: {
      return placement as Placement
    }
  }
}

const CTooltip = defineComponent({
  name: 'CTooltip',
  props: {
    /**
     * Content for your component. If you want to pass non-string value please use dedicated slot `<template #content>...</template>`
     */
    content: String,
    /**
     * Offset of the tooltip relative to its target.
     */
    offset: {
      type: Array,
      default: () => [0, 6],
    },
    /**
     * Describes the placement of your component after Popper.js has applied all the modifiers that may have flipped or altered the originally provided placement property.
     */
    placement: {
      type: String as PropType<Placement>,
      default: 'top',
      validator: (value: string) => {
        return ['top', 'right', 'bottom', 'left'].includes(value)
      },
    },
    /**
     * Sets which event handlers you’d like provided to your toggle prop. You can specify one trigger or an array of them.
     *
     * @values 'click', 'focus', 'hover'
     */
    trigger: {
      type: [String, Array] as PropType<string | string[]>,
      default: 'hover',
      validator: (value: string | string[]) => {
        if (typeof value === 'string') {
          return ['click', 'focus', 'hover'].includes(value)
        }
        if (Array.isArray(value)) {
          return value.every((e) => ['click', 'focus', 'hover'].includes(e))
        }
        return false
      },
    },
    /**
     * Toggle the visibility of tooltip component.
     */
    visible: Boolean,
  },
  emits: [
    /**
     * Callback fired when the component requests to be hidden.
     */
    'hide',
    /**
     * Callback fired when the component requests to be shown.
     */
    'show',
  ],
  setup(props, { attrs, slots, emit }) {
    const togglerRef = ref()
    const tooltipRef = ref()
    const popper = ref()
    const visible = ref(props.visible)

    const handleEnter = (el: RendererElement, done: () => void) => {
      emit('show')
      initPopper()
      el.classList.add('show')
      executeAfterTransition(() => done(), el as HTMLElement)
    }

    const handleLeave = (el: RendererElement, done: () => void) => {
      emit('hide')
      el.classList.remove('show')
      executeAfterTransition(() => {
        done()
        destroyPopper()
      }, el as HTMLElement)
    }

    const handleToggle = (event: Event) => {
      togglerRef.value = event.target
      visible.value = !visible.value
    }

    const initPopper = () => {
      if (togglerRef.value) {
        popper.value = createPopper(togglerRef.value, tooltipRef.value, {
          placement: getPlacement(props.placement, togglerRef.value),
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: props.offset,
              },
            },
          ],
        })
      }
    }

    const destroyPopper = () => {
      if (popper.value) {
        popper.value.destroy()
      }
      popper.value = undefined
    }

    return () => [
      h(
        Teleport,
        {
          to: 'body',
        },
        h(
          Transition,
          {
            onEnter: (el, done) => handleEnter(el, done),
            onLeave: (el, done) => handleLeave(el, done),
          },
          () =>
            visible.value &&
            h(
              'div',
              {
                class: 'tooltip fade bs-tooltip-auto',
                ref: tooltipRef,
                role: 'tooltip',
                ...attrs,
              },
              [
                h('div', { class: 'tooltip-arrow', 'data-popper-arrow': '' }),
                (props.content || slots.content) &&
                  h(
                    'div',
                    { class: 'tooltip-inner' },
                    {
                      default: () => (slots.content && slots.content()) || props.content,
                    },
                  ),
              ],
            ),
        ),
      ),
      slots.toggler &&
        slots.toggler({
          on: {
            click: (event: Event) => props.trigger.includes('click') && handleToggle(event),
            blur: (event: Event) => props.trigger.includes('focus') && handleToggle(event),
            focus: (event: Event) => props.trigger.includes('focus') && handleToggle(event),
            mouseenter: (event: Event) => props.trigger.includes('hover') && handleToggle(event),
            mouseleave: (event: Event) => props.trigger.includes('hover') && handleToggle(event),
          },
        }),
    ]
  },
})

export { CTooltip }
