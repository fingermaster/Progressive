$('.drag-filters')
	.bind('dragstart', function (evt) {
		evt.dataTransfer.setData('text', this.id);
		$('h2').fadeIn('fast');
	})
	// .hover(
	// 	function () { $('div', this).fadeIn(); }, 
	// 	function () { $('div', this).fadeOut(); }
	// );
	
$('#cart')
	.bind('dragover', function (evt) {
		evt.preventDefault();
	})
	.bind('dragenter', function (evt) {
		evt.preventDefault();
	})
	.bind('drop', function (evt) {
		var id = evt.dataTransfer.getData('text'),
			myHTML = $('<div class="filter-container"> \
                        <div class="filter-head"> \
                            <span class="add-day"><i class="icon-square-plus"></i></span> \
                            <span class="filter-title">Days Off &nbsp; &nbsp; <i class="icon-drag"></i></span> \
                            <span class="pull-rt remove-filter"><i class="icon-square-cross"></i></span> \
                        </div> \
                        <div class="day-holder"> \
                            <div class="the-day"> \
                                <span class="day-name">Mon</span> \
                                <span class="day-remove"><i class="icon-close"></i></span> \
                            </div> \
                            <div class="the-day"> \
                                <span class="day-name">Tue</span> \
                                <span class="day-remove"><i class="icon-close"></i></span> \
                            </div> \
                            <div class="the-day"> \
                                <span class="day-name">Fri</span> \
                                <span class="day-remove"><i class="icon-close"></i></span> \
                            </div> \
                            <div class="the-day"> \
                                <span class="day-name">Sat</span> \
                                <span class="day-remove"><i class="icon-close"></i></span> \
                            </div> \
                        </div> \
                    </div>'),
			item = $(myHTML),
			cartList = $("#filter-block"),
			total = $("#total span"),
			price = $('p:eq(1) span', item).text(),
			prevCartItem = null,
			notInCart = (function () {
				var lis = $('p', cartList),
					len = lis.length,
					i;

				for (i = 0; i < len; i++ ) {
					var temp = $(lis[i]);
					if (temp.data('id') === id) {
						prevCartItem = temp;
						return false;
					}
				}
				return true;
			} ()),
			quantLeftEl, quantBoughtEl, quantLeft;

		$("h2").fadeOut('fast');

		// Blink animation on drop
		$(".filter1").removeClass("activity");
		    setTimeout( function() {
		        $(".filter1").addClass("activity");
		      },100);

		if (notInCart) {
			prevCartItem = $('<div class="filter1" />', {
				text : $('p:first', item).text(),
				data : { id : id }
			}).prepend($('<span />', {
				'class' : 'quantity',
				text : '0'
			})).prepend($('<span />', {
				'class' : 'price',
				text : price
			})).appendTo(cartList);
		}

		quantLeftEl = $('p:last span', item);
		quantLeft   = parseInt(quantLeftEl.text(), 10) - 1;
		quantBoughtEl = $('.quantity', prevCartItem);
		quantBoughtEl.text(parseInt(quantBoughtEl.text(), 10) + 1);
		quantLeftEl.text(quantLeft);

		if (quantLeft === 0) {
			item.fadeOut('fast');
		}

		total.text((parseFloat(total.text(), 10) + parseFloat(price.split('$')[1])).toFixed(2));

		evt.stopPropagation();
		return false;
	});