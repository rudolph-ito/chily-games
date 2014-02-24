require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_engine/board_factory.rb'
require ROOT_DIRECTORY + '/app/game_engine/ply_calculator.rb'
require ROOT_DIRECTORY + '/app/game_engine/ply_calculator_factory.rb'

describe PlyCalculatorFactory do
  let(:ply_calculator_factory) { PlyCalculatorFactory }
  let(:game) { double :game, action: action, pieces: pieces, terrains: terrains, variant: variant }
  let(:pieces) { double :pieces }
  let(:terrains) { double :terrains }
  let(:variant) { double :variant }
  let(:user) { double :user, id: 1 }
  let(:board) { double :board }
  let(:user_pieces) { double :user_pieces }
  let(:user_terrains) { double :user_terrains }

  before do
    BoardFactory.stub(:instance).with(variant).and_return(board)
    PlyCalculator.stub(:new)
    pieces.stub(:where).with(user_id: user.id).and_return(user_pieces)
    terrains.stub(:where).with(user_id: user.id).and_return(user_terrains)
  end

  context '.instance' do
    context 'during setup' do
      let(:action) { 'setup' }

      context 'with a user' do
        it 'creates PlyCalculator with just your pieces' do
          PlyCalculatorFactory.instance(game, user)
          expect(PlyCalculator).to have_received(:new).with(board, user_pieces, user_terrains)
        end
      end

      context 'without a user' do
        it 'creates PlyCalculator with all pieces' do
          PlyCalculatorFactory.instance(game)
          expect(PlyCalculator).to have_received(:new).with(board, pieces, terrains)
        end
      end
    end

    context 'during play' do
      let(:action) { 'move' }

      context 'with a user' do
        it 'creates PlyCalculator with just your pieces' do
          PlyCalculatorFactory.instance(game, user)
          expect(PlyCalculator).to have_received(:new).with(board, pieces, terrains)
        end
      end

      context 'without a user' do
        it 'creates PlyCalculator with all pieces' do
          PlyCalculatorFactory.instance(game)
          expect(PlyCalculator).to have_received(:new).with(board, pieces, terrains)
        end
      end
    end
  end
end
