import React from 'react';
import PropTypes from 'prop-types';
import { getSlideHeight } from '../utilities/style-utilities';

const MIN_ZOOM_SCALE = 0;
const MAX_ZOOM_SCALE = 1;

export default function ScrollTransition(props) {
  const getSlideDirection = (start, end, isWrapping) => {
    let direction = 0;
    if (start === end) return direction;

    if (isWrapping) {
      direction = start < end ? -1 : 1;
    } else {
      direction = start < end ? 1 : -1;
    }

    return direction;
  };

  /* eslint-disable complexity */
  const getSlideTargetPosition = (index, positionValue) => {
    let targetPosition = (props.slideWidth + props.cellSpacing) * index;

    let cellAlignOffset = 0;
    switch (props.cellAlign) {
      case 'center':
        cellAlignOffset =
          (props.slideWidth + props.cellSpacing) *
          ((props.slidesToShow - 1) / 2);
        break;
      case 'right':
        cellAlignOffset =
          (props.slideWidth + props.cellSpacing) * (props.slidesToShow - 1);
        break;
    }

    const startSlide = Math.min(
      Math.floor(
        Math.abs((positionValue - cellAlignOffset) / props.slideWidth)
      ),
      props.slideCount - 1
    );

    let offset = 0;

    if (
      props.animation === 'zoom' &&
      (props.currentSlide === index + 1 ||
        (props.currentSlide === 0 && index === props.children.length - 1))
    ) {
      offset = props.slideOffset;
    } else if (
      props.animation === 'zoom' &&
      (props.currentSlide === index - 1 ||
        (props.currentSlide === props.children.length - 1 && index === 0))
    ) {
      offset = -props.slideOffset;
    }

    if (props.wrapAround && index !== startSlide) {
      const direction = getSlideDirection(
        startSlide,
        props.currentSlide,
        props.isWrappingAround
      );
      let slidesBefore = 0;
      let slidesAfter = 0;

      switch (props.cellAlign) {
        case 'left':
          if (direction < 0) {
            slidesBefore = props.slidesToScroll;
            slidesAfter = props.slideCount - props.slidesToScroll - 1;
          } else {
            slidesBefore = 0;
            slidesAfter = props.slideCount - 1;
          }
          break;

        case 'center':
          if (direction === 0) {
            slidesBefore = Math.floor((props.slideCount - 1) / 2);
            slidesAfter = props.slideCount - slidesBefore - 1;
          } else {
            const visibleSlidesFromCenter = Math.ceil(
              (props.slidesToShow - 1) / 2
            );
            const slidesScrollDirection = Math.min(
              visibleSlidesFromCenter + props.slidesToScroll,
              props.slideCount - 1
            );
            const slidesOppositeDirection =
              props.slideCount - slidesScrollDirection - 1;

            if (direction > 0) {
              slidesAfter = slidesScrollDirection;
              slidesBefore = slidesOppositeDirection;
            } else if (direction < 0) {
              slidesBefore = slidesScrollDirection;
              slidesAfter = slidesOppositeDirection;
            }
          }
          break;

        case 'right':
          if (direction > 0) {
            slidesBefore = props.slideCount - props.slidesToScroll - 1;
            slidesAfter = props.slidesToScroll;
          } else {
            slidesBefore = props.slideCount - 1;
            slidesAfter = 0;
          }
          break;
      }

      const distanceFromStart = Math.abs(startSlide - index);
      if (index < startSlide) {
        if (distanceFromStart > slidesBefore) {
          targetPosition =
            (props.slideWidth + props.cellSpacing) * (props.slideCount + index);
        }
      } else if (distanceFromStart > slidesAfter) {
        targetPosition =
          (props.slideWidth + props.cellSpacing) *
          (props.slideCount - index) *
          -1;
      }
    }

    return targetPosition + offset || 0;
  };

  const getSlideStyles = (index, positionValue) => {
    const targetPosition = getSlideTargetPosition(index, positionValue);
    const transformScale =
      props.animation === 'zoom' && props.currentSlide !== index
        ? Math.max(Math.min(props.zoomScale, MAX_ZOOM_SCALE), MIN_ZOOM_SCALE)
        : 1.0;

    return {
      boxSizing: 'border-box',
      display: props.vertical ? 'block' : 'inline-block',
      height: getSlideHeight(props),
      left: props.vertical ? 0 : targetPosition,
      listStyleType: 'none',
      marginBottom: props.vertical ? props.cellSpacing / 2 : 'auto',
      marginLeft: props.vertical ? 'auto' : props.cellSpacing / 2,
      marginRight: props.vertical ? 'auto' : props.cellSpacing / 2,
      marginTop: props.vertical ? props.cellSpacing / 2 : 'auto',
      MozBoxSizing: 'border-box',
      position: 'absolute',
      top: props.vertical ? targetPosition : 0,
      transform: `scale(${transformScale})`,
      transition: 'transform .4s linear',
      verticalAlign: 'top',
      width: props.vertical ? '100%' : props.slideWidth
    };
  };

  /* eslint-enable complexity */
  const formatChildren = children => {
    const { top, left, currentSlide, slidesToShow, vertical } = props;
    const positionValue = vertical ? top : left;

    return React.Children.map(children, (child, index) => {
      const visible =
        index >= currentSlide && index < currentSlide + slidesToShow;

      return (
        <li
          className={`slider-slide${visible ? ' slide-visible' : ''}`}
          style={getSlideStyles(index, positionValue)}
          key={index}
        >
          {child}
        </li>
      );
    });
  };

  const getListStyles = styles => {
    const { deltaX, deltaY } = styles;

    const listWidth = props.slideWidth * React.Children.count(props.children);
    const spacingOffset =
      props.cellSpacing * React.Children.count(props.children);
    const transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;

    return {
      transform,
      WebkitTransform: transform,
      msTransform: `translate(${deltaX}px, ${deltaY}px)`,
      position: 'relative',
      display: 'block',
      margin: props.vertical
        ? `${(props.cellSpacing / 2) * -1}px 0px`
        : `0px ${(props.cellSpacing / 2) * -1}px`,
      padding: 0,
      height: props.vertical ? listWidth + spacingOffset : props.slideHeight,
      width: props.vertical ? 'auto' : listWidth + spacingOffset,
      cursor: props.dragging === true ? 'pointer' : 'inherit',
      boxSizing: 'border-box',
      MozBoxSizing: 'border-box',
      touchAction: `pinch-zoom ${props.vertical ? 'pan-x' : 'pan-y'}`
    };
  };

  const children = formatChildren(props.children);
  const deltaX = props.deltaX;
  const deltaY = props.deltaY;

  return (
    <ul className="slider-list" style={getListStyles({ deltaX, deltaY })}>
      {children}
    </ul>
  );
}

ScrollTransition.propTypes = {
  animation: PropTypes.oneOf(['zoom']),
  cellAlign: PropTypes.string,
  cellSpacing: PropTypes.number,
  currentSlide: PropTypes.number,
  deltaX: PropTypes.number,
  deltaY: PropTypes.number,
  dragging: PropTypes.bool,
  heightMode: PropTypes.oneOf(['first', 'current', 'max']),
  isWrappingAround: PropTypes.bool,
  left: PropTypes.number,
  slideCount: PropTypes.number,
  slideHeight: PropTypes.number,
  slidesToScroll: PropTypes.number,
  slideOffset: PropTypes.number,
  slideWidth: PropTypes.number,
  top: PropTypes.number,
  vertical: PropTypes.bool,
  wrapAround: PropTypes.bool,
  zoomScale: PropTypes.number
};

ScrollTransition.defaultProps = {
  cellAlign: 'left',
  cellSpacing: 0,
  currentSlide: 0,
  deltaX: 0,
  deltaY: 0,
  dragging: false,
  heightMode: 'max',
  isWrappingAround: false,
  left: 0,
  slideCount: 0,
  slideHeight: 0,
  slidesToScroll: 1,
  slideWidth: 0,
  top: 0,
  vertical: false,
  wrapAround: false,
  zoomScale: 0.85
};
