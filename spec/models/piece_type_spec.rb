require 'spec_helper'

describe PieceType do
  context 'validating' do
    let(:piece_type) { build(:piece_type, piece_type_params) }
    let(:piece_type_params) { {} }

    context 'with the default factory' do
      specify { expect(piece_type).to be_valid }
    end

    context 'no alabaster_image' do
      let(:piece_type_params) { {alabaster_image: ''} }
      specify { expect(piece_type).to be_invalid }
    end

    context 'no name' do
      let(:piece_type_params) { {name: ''} }
      specify { expect(piece_type).to be_invalid }
    end

    context 'no onyx_image' do
      let(:piece_type_params) { {onyx_image: ''} }
      specify { expect(piece_type).to be_invalid }
    end
  end

  context ".urls" do
    let!(:piece_type) { create(:piece_type) }
    it "returns a hash of piece type ids to image urls" do
      expect(PieceType.urls).to eql({piece_type.id => {alabaster: piece_type.alabaster_image.url, onyx: piece_type.onyx_image.url}})
    end
  end
end
