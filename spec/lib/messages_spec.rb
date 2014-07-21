require 'spec_helper'

describe Messages do
  context '.effect_description' do
    let(:object) { double :object, some_effect_type: effect_type, some_effect_piece_type_ids: effect_piece_type_ids }
    let(:effect_type) { 'none' }
    let(:effect_piece_type_ids) { [] }

    context 'none' do
      specify { expect(Messages.effect_description(object, 'some')).to eql 'no pieces' }
    end

    context 'all' do
      let(:effect_type) { 'all' }
      specify { expect(Messages.effect_description(object, 'some')).to eql 'all pieces' }
    end

    context 'include' do
      let(:effect_type) { 'include' }
      let(:effect_piece_type_ids) { [1, 2] }
      let(:piece_type1) { double :piece, name: 'piece_type1'}
      let(:piece_type2) { double :piece, name: 'piece_type2'}

      before do
        PieceType.stub(:find).with(1).and_return(piece_type1)
        PieceType.stub(:find).with(2).and_return(piece_type2)
      end

      specify { expect(Messages.effect_description(object, 'some')).to eql 'only piece_type1 and piece_type2' }
    end

    context 'exclude' do
      let(:effect_type) { 'exclude' }
      let(:effect_piece_type_ids) { [1, 2] }
      let(:piece_type1) { double :piece, name: 'piece_type1'}
      let(:piece_type2) { double :piece, name: 'piece_type2'}

      before do
        PieceType.stub(:find).with(1).and_return(piece_type1)
        PieceType.stub(:find).with(2).and_return(piece_type2)
      end

      specify { expect(Messages.effect_description(object, 'some')).to eql 'all pieces except piece_type1 and piece_type2' }
    end
  end
end
