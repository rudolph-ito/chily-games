require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_engine/boards/square_board.rb'
require ROOT_DIRECTORY + '/app/game_engine/boards/hexagonal_board.rb'
require ROOT_DIRECTORY + '/app/game_engine/board_factory.rb'

describe BoardFactory do
  context '.instance' do
    let(:variant) { double :variant, board_columns: 8, board_rows: 10, board_size: 6, board_type: board_type }
    let(:result) { BoardFactory.instance(variant) }

    context 'variant board_type is square' do
      let(:board_type) { 'square' }

      it 'returns a properly initialized SquareBoard' do
        expect(result).to be_a SquareBoard
        expect(result.rows).to eql 10
        expect(result.columns).to eql 8
      end
    end

    context 'variant board_type is hexagonal' do
      let(:board_type) { 'hexagonal' }

      it 'returns a properly initialized HexagonalBoard' do
        expect(result).to be_a HexagonalBoard
        expect(result.size).to eql 6
      end
    end

    context 'variant board_type is other' do
      let(:board_type) { 'other' }

      it 'returns a properly initialized HexagonalBoard' do
        expect{ result }.to raise_error "BoardFactory.instance does not support varaint with board_type: other"
      end
    end
  end
end
