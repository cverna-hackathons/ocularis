import Preview from './ui/preview';

$(document).ready(init);

function init() {

  // This will render each component in preview thumbnail
  $('.component-preview').each((elemIndex, previewElement) => {
    Preview(inferOptionsFrom(previewElement));
  });

  function inferOptionsFrom(previewElement) {
    var $elem   = $(previewElement);
    var options = {
      $container: $elem,
      component: {
        id: $elem.attr('data-id'),
        name: $elem.attr('data-name'),
        publicPath: $elem.attr('data-public-path')
      }
    };
    return options;
  }
}
