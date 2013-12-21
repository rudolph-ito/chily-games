require 'spec_helper'

describe Array do
  describe '#duplicates' do
    specify { ['a', 'b', 'c'].duplicates.should == [] }
    specify { ['a', 'b', 'c', 'a'].duplicates.should == ['a'] }
    specify { ['a', 'b', 'c', 'a', 'b'].duplicates.should == ['a', 'b'] }
  end
end
