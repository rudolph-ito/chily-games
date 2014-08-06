require 'spec_helper'

describe VariantDecorator do
  let(:decorator) { VariantDecorator.new(variant) }
  let(:variant) { double :variant, variant_params }

  context '#board_description' do
    context 'square board' do
      let(:variant_params) { { square_board?: true, board_rows: 2, board_columns: 3 } }

      it 'returns Square Board with the dimensions' do
        expect(decorator.board_description).to eql "Square Board (2x3)"
      end
    end

    context 'not a square board' do
      let(:variant_params) { { square_board?: false, board_size: 5 } }

      it 'returns Hexagonal Board with the size' do
        expect(decorator.board_description).to eql "Hexagonal Board (size 5)"
      end
    end
  end

  context '#piece_ranks_description' do
    context 'without piece ranks' do
      let(:variant_params) { { piece_ranks?: false } }

      it 'returns full capturing description' do
        expect(decorator.piece_ranks_description).to eql 'Pieces can capture all other pieces'
      end
    end

    context 'with piece ranks' do
      let(:variant_params) { { piece_ranks?: true } }

      it 'returns piece rank capturing description' do
        expect(decorator.piece_ranks_description).to eql 'Pieces can only capture units of the same rank or lower'
      end
    end
  end

  context '#to_s' do
    let(:variant_params) { { user: user } }
    let(:user) { double :user, username: 'John Doe' }

    it 'returns Cyvasse with the author' do
      expect(decorator.to_s).to eql 'Cyvasse by John Doe'
    end
  end
end
