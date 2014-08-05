class SupportedRank

  attr_reader :combined_ranks, :rank, :support_type

  def initialize(rank, support_type, supporting_ranks)
    @rank = rank
    @support_type = support_type
    @combined_ranks = [rank] + supporting_ranks
  end

  def calculate
    case support_type
    when 'binary'
      calculate_binary
    when 'sum'
      calculate_sum
    else
      rank
    end
  end

  private

  def calculate_binary
    while combined_ranks.count > 1
      combined_ranks.sort!
      combined_ranks[1] += 1 if combined_ranks[0] == combined_ranks[1]
      combined_ranks.shift
    end

    combined_ranks[0]
  end

  def calculate_sum
    combined_ranks.sum
  end

end
