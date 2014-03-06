require 'spec_helper'

describe Topic do
  context 'validating' do
    let(:topic) { build(:topic, topic_params) }
    let(:topic_params) { {} }

    context 'with the default factory' do
      specify { expect(topic).to be_valid }
    end

    context 'no parent' do
      let(:topic_params) { {parent: nil} }
      specify { expect(topic).to be_invalid }
    end

    context 'no title' do
      let(:topic_params) { {title: nil} }
      specify { expect(topic).to be_invalid }
    end

    context 'duplicate title within parent' do
      let(:topic_params) { {parent: create(:discussion), title: 'A topic'} }
      before { create(:topic, topic_params) }
      specify { expect(topic).to be_invalid }
    end
  end
end
