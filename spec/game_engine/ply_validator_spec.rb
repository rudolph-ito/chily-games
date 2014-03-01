require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_engine/ply_calculator.rb'
require ROOT_DIRECTORY + '/app/game_engine/ply_validator.rb'

describe PlyValidator do
  let(:ply_validator) { PlyValidator.new(game, piece, to, range_capture) }
  let(:game) { double :game, board: board, current_setup: current_setup }
  let(:board) { double :board }
  let(:current_setup) { double :current_setup }
  let(:piece) { double :piece, coordinate: from, rule: piece_rule }
  let(:piece_rule) { double :piece_rule }
  let(:from) { {'x'=>1, 'y'=>0} }
  let(:to) { {'x'=>1, 'y'=>1} }
  let(:range_capture) { nil }
  let(:ply_calculator) { double :ply_calculator }

  before { PlyCalculator.stub(:new).with(board, current_setup).and_return(ply_calculator) }

  context 'movement is invalid' do
    before { ply_calculator.stub(:valid_plies).with(piece, piece.coordinate, 'movement').and_return([]) }

    it 'returns false' do
      expect(ply_validator.call).to be_false
    end
  end

  context 'movement is valid' do
    before { ply_calculator.stub(:valid_plies).with(piece, piece.coordinate, 'movement').and_return([to]) }

    context 'piece captures by movement' do
      before { piece_rule.stub(:range_capture?).and_return(false) }

      it 'returns true' do
        expect(ply_validator.call).to be_true
      end
    end

    context 'piece captures by range' do
      before { piece_rule.stub(:range_capture?).and_return(true) }

      context 'range_capture not specified' do
        it 'returns true' do
          expect(ply_validator.call).to be_true
        end
      end

      context 'range capture specified' do
        let(:range_capture) { {'x'=>2, 'y'=>2} }

        context 'range capture invalid' do
          before { ply_calculator.stub(:valid_plies).with(piece, to, 'range').and_return([]) }

          it 'returns false' do
            expect(ply_validator.call).to be_false
          end
        end

        context 'range capture valid' do
          before { ply_calculator.stub(:valid_plies).with(piece, to, 'range').and_return([range_capture]) }

          it 'returns true' do
            expect(ply_validator.call).to be_true
          end
        end
      end
    end
  end
end
