import { expect } from 'chai';

import { isSingleNumberOrAlphanumericIdentifier } from '../../../autotranslate/server/isSingleNumberOrAlphanumericIdentifier';

// AS-PL customization: these regressions ensure standalone LiveChat identifiers bypass translation while identifiers in sentences still reach DeepL.
describe('isSingleNumberOrAlphanumericIdentifier', () => {
	it('returns true for a message containing only digits', () => {
		expect(isSingleNumberOrAlphanumericIdentifier('123456789')).to.equal(true);
	});

	it('returns true for one word containing both letters and digits', () => {
		expect(isSingleNumberOrAlphanumericIdentifier('F000BL08B9')).to.equal(true);
	});

	it('ignores surrounding whitespace', () => {
		expect(isSingleNumberOrAlphanumericIdentifier('  F000BL08B9  ')).to.equal(true);
	});

	it('returns false for a word containing only letters', () => {
		expect(isSingleNumberOrAlphanumericIdentifier('Hello')).to.equal(false);
	});

	it('returns false when the identifier is part of a multi-word message', () => {
		expect(isSingleNumberOrAlphanumericIdentifier('Problem F000BL08B9')).to.equal(false);
	});

	it('returns false when a number is part of a natural-language message', () => {
		expect(isSingleNumberOrAlphanumericIdentifier('Mam 2 pytania')).to.equal(false);
	});

	it('returns false when the single value contains characters other than letters and digits', () => {
		expect(isSingleNumberOrAlphanumericIdentifier('ABC-123')).to.equal(false);
	});
});
