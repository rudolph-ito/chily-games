class Array
  # Returns a unique array of all the duplicates
  #
  #   ['a', 'b', 'c'].duplicates => []
  #   ['a', 'b', 'c', 'a'].duplicates => ['a', 'b']
  #   ['a', 'b', 'c', 'a', 'b'].duplicates => ['a', 'b']
  def duplicates
    inject(Hash.new(0)){ |h,v| h[v] += 1; h }.select{ |k,v| v > 1 }.keys
  end
end
