M.AutoInit();


Reveal.initialize({
				controls: false,
				progress: false,
				history: false,
				center: false,
				width: "100%",
				height: "100%",
				margin: 0,
				minScale: 1,
				maxScale: 1,
				keyboard: false,
				overview: false,
				hideAddressBar: true,
				transition: 'fade', // none/fade/slide/convex/concave/zoom
				dependencies: []
			});


$(document).ready(function() {
	$('.btn-full').on('click', function(){
		$('.btn-full').removeClass('active');
		$(this).addClass('active');
	})
});
