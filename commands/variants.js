/* eslint-disable no-undef */
/* eslint-disable no-inline-comments */
module.exports = {
	name: 'variants',
	description: 'Provide shopify variant info',
	aliases: ['vars', 'atc', 'shopify'],
	execute(message, args) {
		const fetch = require('node-fetch');
		function validURL(str) {
			const pattern = new RegExp(
				'^(https?:\\/\\/)?' + // protocol
                    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                    '(\\#[-a-z\\d_]*)?$',
				'i',
			); // fragment locator
			return !!pattern.test(str);
		}
		function sendVariants(json, atcBase) {
			if (json.product) {
				const product = json.product;
				const name = product.title;
				const field_list = [];
				for (variant in product.variants) {
					const variant_names = [];
					variant = product.variants[variant];
					for (i = 1; i < 4; i++) {
						const k = `option${i}`;
						if (
							variant[k] &&
                            variant[k] != 'Default Title' &&
                            variant[k] != '-'
						) {
							variant_names.push(variant[k]);
						}
					}
					const price = variant.price;
					if (
						price.substring(price.length - 3, price.length) ==
                        '.00'
					) {
						const actualPrice = price.substring(
							0,
							price.length - 3,
						);
						variant.price = '$' + actualPrice;
					}
					const variant_id = variant.id.toString();
					const variant_name = variant_names.join(' ').trim();
					const atc =
                        atcBase.protocol +
                        '//' +
                        atcBase.hostname +
                        '/cart/' +
                        variant_id +
                        ':1';
					entries = ['fields'];
					if (variant_name == '') {
						const entry = {
							name: variant_id,
							value: '[Add to Cart](' + atc + ')',
							inline: true,
						};
						field_list.push(entry);
					}
					else {
						const entry = {
							name: '**' + variant_name + '** - Add to Cart',
							value: '[' + variant_id + '](' + atc + ')',
							inline: true,
						};
						field_list.push(entry);
					}
				}
				const VariantsEmbed = {
					author: {
						name: name,
					},
					title: atcBase.hostname.toString(),
					url: args[0],
					color: 0xffcc,
					fields: field_list,
					footer: {
						text: 'Developed by Ollie#4747',
						icon_url:
								'https://pbs.twimg.com/profile_images/1275018559219855360/xtdJ4gia_400x400.jpg',
					},
				};
				return message.channel.send({ embed: VariantsEmbed });
			}
			else {
				return;
			}
		}
		if (!args.length) {
			return message.channel.send(
				`You didn't provide a Shopify product link, ${message.author}!`,
			);
		}
		else if (!validURL(args[0])) {
			return message.channel.send('That is not a valid link.');
		}
		else if (validURL(args[0])) {
			const atcBase = new URL(args[0]);
			const base_url = args[0];
			const url = base_url + '.json';
			const settings = { method: 'Get' };
			fetch(url, settings)
				.then((res) => {
					return res.text();
				})
				.then(resAsBodyText => {
					try {
						const bodyAsJson = JSON.parse(resAsBodyText);
						if (typeof bodyAsJson == 'object') {
							return bodyAsJson;
						}
						else {
							return;
						}
					}
					catch (error) {
						Promise.reject({ body:resAsBodyText, type:'unparsable' });
					}
				})
				.then(json => {
					sendVariants(json, atcBase);
				})
				.catch(err => {
					throw err;
				});
		}
	},
};
