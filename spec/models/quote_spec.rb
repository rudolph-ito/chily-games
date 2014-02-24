require 'spec_helper'

describe Quote do
  context 'validating' do
    let(:quote) { build(:quote, quote_params) }
    let(:quote_params) { {} }

    context 'with the default factory' do
      specify { expect(quote).to be_valid }
    end

    context 'no book_name' do
      let(:quote_params) { {book_name: ''} }
      specify { expect(quote).to be_invalid }
    end

    context 'no book_number' do
      let(:quote_params) { {book_number: ''} }
      specify { expect(quote).to be_invalid }
    end

    context 'no chapter_name' do
      let(:quote_params) { {chapter_name: ''} }
      specify { expect(quote).to be_invalid }
    end

    context 'no chapter_number' do
      let(:quote_params) { {chapter_number: ''} }
      specify { expect(quote).to be_invalid }
    end

    context 'no description' do
      let(:quote_params) { {description: ''} }
      specify { expect(quote).to be_invalid }
    end

    context 'no number' do
      let(:quote_params) { {number: ''} }
      specify { expect(quote).to be_invalid }
    end

    context 'no text' do
      let(:quote_params) { {text: ''} }
      specify { expect(quote).to be_invalid }
    end
  end

  context '#html' do
    let(:quote) { build(:quote, text: '*Cyvasse*, the game was called.') }

    it 'parses the text as markdown' do
      expect(quote.html).to eql "<p><em>Cyvasse</em>, the game was called.</p>\n"
    end
  end
end
