define([
    'jquery',
    'ko'
], function ($, ko) {
    'use strict';

    return function (target) {
        return target.extend({
            qtyOrdered: {},
            reloadAjaxFlag: false,
            /**
             * Handle events like click or change
             */
            eventListener: function() {
                var self = this;

                if (this.jsonSystemConfig.hidePrice) {
                    $(this.formSelector).find('button[type=submit]').css('display','none');
                    var messageWarningPrice = $.mage.__('Can\'t add to cart right now. The price of this product is hidden for your customer group.');
                    $(this.mainProductSectionClass).append('<strong>' + messageWarningPrice + '</strong>');
                }

                $(self.ptdTableClass).on('reloadTable', function() {
                    if ($(self.checkoutCartConfigureClass).length &&
                        (!$(self.bssTableRowClass).length || !$(self.supperAttributeClass).length || $(self.lastSupperAttributeClass).length)) {
                        self.loadTableData();
                    }
                })
                if (this.isAjaxLoad) {
                    $('body').on('change', self.supperAttributeClass, function () {
                        var $this = $(this);
                        if ($this.closest('.bss-last-select').length === 0) {
                            self.loadTableData();
                        }
                    });
                } else {
                    $('body').on('change', self.supperAttributeClass, function () {
                        var $this = $(this);
                        if ($this.closest('.bss-last-select').length === 0) {
                            self.loadTableData();
                        }
                        self.calculateTotal();
                    });
                }

                $(this.addToCartClass).on('change', self.optionPrice, function(event){
                    var prices = {
                        price: event.target.value,
                        priceExcelTax: event.target.dataset.excltaxPrice
                    };
                    self.customOption(prices);
                });

                $(document).on('removeClass', function () {
                    self.removeSelectedClass();
                });
            },
            /**
             * Load table data by ajax
             */
            loadTableData: function() {
                var options = {},
                    data = [],
                    self = this,
                    attrId,
                    attrVal,
                    attributeSelectElm = self.supperAttributeClass,
                    attrCount = 0,
                    error = false;
                self.reloadAjaxFlag = false;
                $(attributeSelectElm).each(function () {
                    var $this = $(this);
                    if ($this.hasClass('.bss') || $this.closest('.bss-last-select').length) {
                        attrCount++;
                    }
                    if (!$this.closest('div.field').hasClass('bss-last-select') && !$this.hasClass('bss')) {
                        attrId = self.getAttrValue($this.closest('.swatch-attribute'), 'attribute-id');
                        attrVal = self.getAttrValue($this.closest('.swatch-attribute'), 'data-option-selected');
                        if ($this.val()) {
                            if (!attrVal) {
                                attrVal = $this.val();
                                if (typeof attrVal == "undefined") {
                                    attrVal = self.getAttrValue($this.parent().find('.swatch-option:eq(0)'), 'option-id');
                                }
                            }
                            if (self.getAttrValue($this, 'name') != '') {
                                attrId = self.getAttrValue($this, 'name').replace(/^\D+|\D+$/g, "");
                                if (typeof attrId == "undefined") {
                                    attrId = self.getAttrValue($this.closest('.swatch-attribute'), 'attribute-id');
                                }
                            }
                            data.push(attrId + '_' + attrVal);
                        }

                        if ($this.closest('.swatch-attribute').find('.swatch-select').is("select") && typeof attrVal == "undefined") {
                            attrVal = $this.closest('.swatch-attribute').find('option:eq(1)').val();
                            data.push(attrId + '_' + attrVal);
                        }
                        if (_.isEmpty(data)){
                            attrVal = self.getAttrValue($this.parent().find('.swatch-option:eq(0)'), 'option-id');
                            attrId = self.getAttrValue($this.closest('.swatch-attribute'), 'attribute-id');
                            data.push(attrId + '_' + attrVal);
                        }
                        if (typeof attrId == "undefined" || typeof attrVal == "undefined") {
                            error = true;
                        }
                    }
                });
                options.productId = $('#product_addtocart_form input[name=product]').val();
                options.option = data;

                if (error && this.jsonSystemConfig.enableSDCP) {
                    return;
                }

                if ($(attributeSelectElm).length > 0 && !_.isEmpty(options.option) || attrCount == $(attributeSelectElm).length) {
                    $.ajax({
                        type: 'post',
                        url: this.jsonSystemConfig.ajaxLoadUrl,
                        data: {options: JSON.stringify(options)},
                        dataType: 'json',
                        beforeSend: function () {
                            $('div.bss-ptd-table').addClass('bss-cwd-spinner');
                        },
                        success: function (data) {
                            self.addQtyToData(data);
                            self.reloadAjaxFlag = true;
                            $(document).trigger('contentUpdated');
                        },
                        complete: function () {
                            $('div.bss-ptd-table').removeClass('bss-cwd-spinner');
                        }
                    });
                }
            },

            /**
             * Recalculate total order price
             * @param orderQtyTierPrice
             */
            recalculateTotal: function(orderQtyTierPrice) {
                var price = 0,
                    priceExclTax = 0,
                    productTierPrice = 0,
                    productTierPriceExclTax = 0,
                    subtotal = 0,
                    subtotal_excl_tax = 0,
                    data,
                    self = this,
                    customOptionPrice = $(self.optionPrice).val(),
                    customOptionPriceExlTax = this.getAttrValue($(self.optionPrice), 'data-excltax-price'),
                    sumQtyOrdered = 0;
                _.each(self.data(), function (product) {
                    if (!isNaN(parseFloat(product.order_qty)) && self.reloadAjaxFlag) {
                        var pid = product.id;
                        self.qtyOrdered[pid] = parseFloat(product.order_qty);
                    }
                });
                _.each(self.qtyOrdered, function (qtyCheck, pid) {
                    sumQtyOrdered += qtyCheck;
                });
                price += parseFloat(customOptionPrice);
                priceExclTax += parseFloat(customOptionPriceExlTax);
                if (this.isAjaxLoad) {
                    data = this.dataAjaxOrdered();
                } else {
                    data = this.data();
                }

                _.each(data, function (product) {
                    if (product.tierPrice && sumQtyOrdered > 0) {
                        _.each(product.tierPrice, function (tierPrice) {
                            if (orderQtyTierPrice >= tierPrice.qty) {
                                productTierPrice = parseFloat(tierPrice.price) + parseFloat(customOptionPrice);
                                productTierPriceExclTax = parseFloat(tierPrice.price_excl_tax) + parseFloat(customOptionPrice);
                            }
                        });

                        if (!productTierPrice) {
                            productTierPrice = parseFloat(product.current_price) + parseFloat(customOptionPrice);
                            productTierPriceExclTax = parseFloat(product.current_price_excl_tax) + parseFloat(customOptionPrice);
                        }
                        var customOptionPriceChild = 0,
                            customOptionPriceExlTaxChild = 0;
                        if ($(self.optionPrice +'-'+ product.id).length && $(self.optionPrice +'-'+ product.id).val() > 0) {
                            customOptionPriceChild = $(self.optionPrice +'-'+ product.id).val();
                            customOptionPriceExlTaxChild = self.getAttrValue($(self.optionPrice +'-'+ product.id), 'data-excltax-price');
                        }

                        productTierPrice = parseFloat(productTierPrice) + parseFloat(customOptionPriceChild);
                        productTierPriceExclTax = parseFloat(productTierPriceExclTax) + parseFloat(customOptionPriceExlTaxChild);

                        subtotal = parseFloat(product.order_qty) * parseFloat(productTierPrice);
                        subtotal_excl_tax = parseFloat(product.order_qty) * parseFloat(productTierPriceExclTax);
                        if (subtotal) {
                            product.price = productTierPrice;
                            product.price_excl_tax = productTierPriceExclTax;
                            product.subtotal = subtotal;
                            product.subtotal_excl_tax = subtotal_excl_tax;
                        }
                    }
                    price += parseFloat(product.subtotal);
                    priceExclTax += parseFloat(product.subtotal_excl_tax);
                });
                this.orderPrice(this.getFormattedPrice(price));
                this.orderPriceExclTax(this.getFormattedPrice(priceExclTax));
            },
            /**
             * @param orderQtyTierPrice
             */
            recalculateTierPrice: function() {
                var self = this,
                    customOptionPrice = $(self.optionPrice).val(),
                    customOptionPriceExlTax = this.getAttrValue($(self.optionPrice), 'data-excltax-price'),
                    customOptionPriceChild = 0,
                    customOptionPriceExlTaxChild = 0;

                var data = [],
                    productTierPrice;

                var orderQtyTierPrice = 0;

                if (this.isAjaxLoad) {
                    data = this.dataAjaxOrdered();
                } else {
                    data = this.data();
                }

                _.each(data, function (item) {
                    if (item.order_qty < 0 || isNaN(item.order_qty) || !item.order_qty) {
                        item.order_qty = 0;
                    }
                    if (self.jsonSystemConfig.tierPriceAdvanced) {
                        orderQtyTierPrice += parseInt(item.order_qty);
                    }
                });

                _.each(data, function (product) {
                    let check = false;

                    if (product.tierPrice) {
                        if (!self.jsonSystemConfig.tierPriceAdvanced) {
                            if (product.order_qty < 0 || isNaN(product.order_qty) || !product.order_qty) {
                                product.order_qty = 0;
                            }
                            orderQtyTierPrice = parseInt(product.order_qty);
                        }

                        _.each(product.tierPrice, function (tierPrice) {
                            if (orderQtyTierPrice >= tierPrice.qty) {
                                productTierPrice = tierPrice.price;
                                check = true;
                            }
                        });
                    }

                    if (!productTierPrice || !check) {
                        productTierPrice = product.old_price;
                    }

                    if ($(self.optionPrice +'-'+ product.id).length && $(self.optionPrice +'-'+ product.id).val() > 0) {
                        customOptionPriceChild = $(self.optionPrice +'-'+ product.id).val();
                        customOptionPriceExlTaxChild = self.getAttrValue($(self.optionPrice +'-'+ product.id), 'data-excltax-price');
                    }

                    product.price = parseFloat(productTierPrice) + parseFloat(customOptionPrice) + parseFloat(customOptionPriceChild);
                    product.price_excl_tax = parseFloat(productTierPrice) + parseFloat(customOptionPriceExlTax) + parseFloat(customOptionPriceExlTaxChild);
                    product.subtotal = parseFloat(product.order_qty) * parseFloat(product.price);
                    product.subtotal_excl_tax = parseFloat(product.order_qty) * parseFloat(product.price_excl_tax);
                });
            },
            /**
             * Recalculate table
             */
            calculateTotal: function () {
                var qty = 0,
                    price = 0,
                    priceExclTax = 0,
                    data = ko.observableArray([]),
                    dataOrdered = ko.observableArray([]),
                    self = this,
                    i = 0,
                    orderQtyTierPrice = 0,
                    newDataOrdered,
                    sameTierPrice = this.checkSameTierPrice(this.data());
                _.each(this.data(), function (product) {
                    if (!product.order_qty || isNaN(parseFloat(product.order_qty))) {
                        product.order_qty = 0;
                    }
                    if (product.order_qty >= 0) {
                        if (product.order_qty >= 0) {
                            dataOrdered.push(product);
                            if (self.isAjaxLoad) {
                                var dataAjaxOrdered = self.dataAjaxOrdered();
                                _.each(dataAjaxOrdered, function (productOrdered) {
                                    if (product.id == productOrdered.id) {
                                        dataAjaxOrdered = _.without(dataAjaxOrdered, productOrdered);
                                    }
                                });

                                dataAjaxOrdered.push(product);
                                self.dataAjaxOrdered(dataAjaxOrdered);
                            }
                        }

                        if (product.tierPrice) {
                            var productTierPrice = 0,
                                orderedQty = 0,
                                hasTierPrice = false;

                            if (self.jsonSystemConfig.tierPriceAdvanced && sameTierPrice) {
                                if (self.isDecimalQty) {
                                    orderQtyTierPrice += parseFloat(product.order_qty);
                                } else {
                                    orderQtyTierPrice += parseInt(product.order_qty);
                                }
                            }

                            // calculate total qty when enable ajax load
                            if (self.isAjaxLoad && self.jsonSystemConfig.tierPriceAdvanced && sameTierPrice) {
                                _.each(self.dataAjaxOrdered(), function (product, id) {
                                    orderedQty += parseFloat(product.order_qty);
                                });
                                orderQtyTierPrice = orderedQty;
                            }

                            _.each(product.tierPrice, function (tierPrice) {
                                if (product.order_qty >= tierPrice.qty || orderQtyTierPrice >= tierPrice.qty) {
                                    productTierPrice = tierPrice;
                                    hasTierPrice = true;
                                }
                            });
                            if (hasTierPrice) {
                                self.recalculateTierPrice();
                                price += parseFloat(product.subtotal);
                                priceExclTax += parseFloat(product.subtotal_excl_tax);
                            } else {
                                self.calculatePrice(product);
                                price += parseFloat(product.subtotal);
                                priceExclTax += parseFloat(product.subtotal_excl_tax);
                            }
                        } else {
                            self.calculatePrice(product);
                            price += parseFloat(product.subtotal);
                            priceExclTax += parseFloat(product.subtotal_excl_tax);
                        }

                        if (product.order_qty > 0 && self.incrementQty && product.order_qty % self.incrementQty !== 0) {
                            i++;
                        }

                        if (self.isDecimalQty) {
                            if (product.order_qty > 0) {
                                qty += parseFloat(product.order_qty);
                            }
                        } else {
                            if (product.order_qty > 0) {
                                qty += parseInt(product.order_qty);
                            }
                        }
                    }

                    data.push(product);
                });

                if (this.incrementQty) {
                    if (i > 0) {
                        this.disableBtnCart();
                    } else {
                        this.enableBtnCart();
                    }
                }

                if (qty < 0) {
                    this.isQtyError(true);
                } else {
                    this.isQtyError(false);
                }

                this.orderQty(qty);
                if (this.jsonSystemConfig.tierPriceAdvanced && sameTierPrice) {
                    this.recalculateTotal(orderQtyTierPrice);
                } else {
                    this.orderPrice(this.getFormattedPrice(price));
                    this.orderPriceExclTax(this.getFormattedPrice(priceExclTax));
                }

                if (this.canUpdateQty() === undefined && !this.canUpdateQty()) {
                    this.updateCartQty(data());
                    this.canUpdateQty(false);
                }
                this.data([]);
                this.data(data());
                if (this.isAjaxLoad) {
                    newDataOrdered = this.prepareOrderedProduct(this.dataAjaxOrdered());
                } else {
                    newDataOrdered = this.prepareOrderedProduct(dataOrdered());
                }
                this.dataOrdered([]);
                this.dataOrdered(newDataOrdered);
            }
        });
    };
});
