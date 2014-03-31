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
  let(:ply_calculator) { double :ply_calculator }

  before { PlyCalculator.stub(:new).with(board, current_setup).and_return(ply_calculator) }

  shared_examples 'returns false' do
    it 'returns false' do
      expect(ply_validator.call).to be_false
    end
  end

  shared_examples 'returns true' do
    it 'returns true' do
      expect(ply_validator.call).to be_true
    end
  end

  context 'piece captures by movement' do
    let(:range_capture) { nil }
    before { piece_rule.stub(:range_capture?).and_return(false) }

    context 'no movement' do
      let(:to) { nil }
      include_examples 'returns false'
    end

    context 'movement invalid' do
      before { ply_calculator.stub(:valid_plies).with(piece, from, 'movement').and_return([]) }
      include_examples 'returns false'
    end

    context 'movement valid' do
      before { ply_calculator.stub(:valid_plies).with(piece, from, 'movement').and_return([to]) }
      include_examples 'returns true'
    end
  end

  context 'piece captures by range' do
    let(:range_capture) { {'x'=>1, 'y'=>2} }
    before { piece_rule.stub(:range_capture?).and_return(true) }

    context 'piece can move and range capture' do
      before { piece_rule.stub(:move_and_range_capture?).and_return(true) }

      context 'no movement' do
        let(:to) { nil }

        context 'no range capture' do
          let(:range_capture) { nil }
          include_examples 'returns false'
        end

        context 'range capture invalid' do
          before { ply_calculator.stub(:valid_plies).with(piece, from, 'range').and_return([]) }
          include_examples 'returns false'
        end

        context 'range capture valid' do
          before { ply_calculator.stub(:valid_plies).with(piece, from, 'range').and_return([range_capture]) }
          include_examples 'returns true'
        end
      end

      context 'movement invalid' do
        before { ply_calculator.stub(:valid_plies).with(piece, from, 'movement').and_return([]) }
        include_examples 'returns false'
      end

      context 'movement valid' do
        before { ply_calculator.stub(:valid_plies).with(piece, from, 'movement').and_return([to]) }

        context 'no range capture' do
          let(:range_capture) { nil }
          include_examples 'returns true'
        end

        context 'range capture invalid' do
          before { ply_calculator.stub(:valid_plies).with(piece, to, 'range').and_return([]) }
          include_examples 'returns false'
        end

        context 'range capture valid' do
          before { ply_calculator.stub(:valid_plies).with(piece, to, 'range').and_return([range_capture]) }
          include_examples 'returns true'
        end
      end
    end

    context 'piece cannot move and range capture' do
      before { piece_rule.stub(:move_and_range_capture?).and_return(false) }

      context 'no movement' do
        let(:to) { nil }

        context 'no range capture' do
          let(:range_capture) { nil }
          include_examples 'returns false'
        end

        context 'range capture invalid' do
          before { ply_calculator.stub(:valid_plies).with(piece, from, 'range').and_return([]) }
          include_examples 'returns false'
        end

        context 'range capture valid' do
          before { ply_calculator.stub(:valid_plies).with(piece, from, 'range').and_return([range_capture]) }
          include_examples 'returns true'
        end
      end

      context 'movement invalid' do
        before { ply_calculator.stub(:valid_plies).with(piece, from, 'movement').and_return([]) }
        include_examples 'returns false'
      end

      context 'movement valid' do
        before { ply_calculator.stub(:valid_plies).with(piece, from, 'movement').and_return([to]) }

        context 'no range capture' do
          let(:range_capture) { nil }
          include_examples 'returns true'
        end

        context 'range capture specified' do
          include_examples 'returns false'
        end
      end
    end
  end
end
